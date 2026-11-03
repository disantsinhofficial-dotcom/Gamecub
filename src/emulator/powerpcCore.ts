import { DolHeader, ExecutionLog, DiscHeader } from './types';

export class PowerPCCore {
  // 24MB Main 1T-SRAM
  public ram: Uint8Array;
  public ramView: DataView;

  // 32 General Purpose Registers
  public gpr: Uint32Array = new Uint32Array(32);
  // 32 Floating Point Registers (64-bit double)
  public fpr: Float64Array = new Float64Array(32);

  // Special Purpose Registers
  public pc: number = 0x80003150;
  public lr: number = 0;
  public ctr: number = 0;
  public msr: number = 0x00002030;
  public cr: number = 0;
  public xer: number = 0;

  // Execution Stats
  public totalInstructionsExecuted: number = 0;
  public isHalted: boolean = false;
  public entryPoint: number = 0x80003150;

  // Logging callback
  public onLog?: (log: ExecutionLog) => void;

  // Hardware I/O Registers
  public viDisplayBufferAddress: number = 0x80000000;
  public viWidth: number = 640;
  public viHeight: number = 480;
  public cpReadPointer: number = 0;
  public cpWritePointer: number = 0;

  constructor() {
    // Allocate 24MB Main RAM (0x01800000 bytes)
    this.ram = new Uint8Array(24 * 1024 * 1024);
    this.ramView = new DataView(this.ram.buffer);
    this.reset();
  }

  public reset() {
    this.ram.fill(0);
    this.gpr.fill(0);
    this.fpr.fill(0);
    this.pc = 0x80003150;
    this.lr = 0;
    this.ctr = 0;
    this.cr = 0;
    this.xer = 0;
    this.msr = 0x00002030;
    this.totalInstructionsExecuted = 0;
    this.isHalted = false;

    // Standard GameCube OS Stack & SDA setup
    this.gpr[1] = 0x817FFF00; // r1 = Stack Pointer near end of 24MB RAM
    this.gpr[2] = 0x80300000; // r2 = Table of Contents / SDA2
    this.gpr[13] = 0x80310000; // r13 = Small Data Area 1
    this.gpr[3] = 0; // r3 = return code / arg
  }

  public emitLog(subsystem: ExecutionLog['subsystem'], message: string, level: ExecutionLog['level'] = 'info') {
    if (this.onLog) {
      this.onLog({
        id: Math.random().toString(36).slice(2, 9),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        subsystem,
        message,
        level,
      });
    }
  }

  // Address translation: converts virtual address (e.g. 0x80003150) to physical RAM offset
  public translateAddress(addr: number): number | null {
    const unsigned = addr >>> 0;
    // Cached 1T-SRAM: 0x80000000 - 0x817FFFFF
    if (unsigned >= 0x80000000 && unsigned < 0x81800000) {
      return unsigned - 0x80000000;
    }
    // Uncached 1T-SRAM: 0xC0000000 - 0xC17FFFFF
    if (unsigned >= 0xC0000000 && unsigned < 0xC1800000) {
      return unsigned - 0xC0000000;
    }
    // Hardware I/O registers: 0xCC000000 - 0xCC008000
    if (unsigned >= 0xCC000000 && unsigned < 0xCC009000) {
      return -1; // Handled by MMIO
    }
    return null;
  }

  public readUint32(addr: number): number {
    const offset = this.translateAddress(addr);
    if (offset !== null && offset >= 0 && offset + 4 <= this.ram.length) {
      return this.ramView.getUint32(offset, false); // Big Endian
    }
    // MMIO Registers
    if (offset === -1) {
      const reg = addr >>> 0;
      if (reg === 0xCC002000) return this.viDisplayBufferAddress; // VI FB address
      if (reg === 0xCC002004) return 0x00000001; // VI status (interlace / NTSC)
      if (reg === 0xCC003000) return 0x00000000; // PI Interrupt status
      if (reg === 0xCC006400) return 0x00000000; // SI Controller 1
      return 0;
    }
    return 0;
  }

  public writeUint32(addr: number, value: number) {
    const offset = this.translateAddress(addr);
    if (offset !== null && offset >= 0 && offset + 4 <= this.ram.length) {
      this.ramView.setUint32(offset, value >>> 0, false);
      return;
    }
    // MMIO Registers
    if (offset === -1) {
      const reg = addr >>> 0;
      if (reg === 0xCC002000) {
        this.viDisplayBufferAddress = value >>> 0;
      }
    }
  }

  // Load a DOL binary into virtual RAM using its DOL header
  public loadDol(dolBuffer: ArrayBuffer, header: DolHeader): boolean {
    this.reset();
    const sourceBytes = new Uint8Array(dolBuffer);
    const view = new DataView(dolBuffer);

    this.emitLog('DVD', `Parsing DOL executable with ${header.textOffsets.length} text sections and ${header.dataOffsets.length} data sections.`, 'info');

    // 1. Load Text Sections into RAM
    header.textOffsets.forEach((offset, idx) => {
      const size = header.textSizes[idx];
      const targetAddr = header.textAddresses[idx];
      if (offset > 0 && size > 0 && targetAddr >= 0x80000000) {
        const destOffset = targetAddr - 0x80000000;
        if (destOffset + size <= this.ram.length && offset + size <= sourceBytes.length) {
          this.ram.set(sourceBytes.subarray(offset, offset + size), destOffset);
          this.emitLog('MEMORY', `Loaded Text[${idx}]: 0x${targetAddr.toString(16)} (size: ${size} bytes)`, 'info');
        }
      }
    });

    // 2. Load Data Sections into RAM
    header.dataOffsets.forEach((offset, idx) => {
      const size = header.dataSizes[idx];
      const targetAddr = header.dataAddresses[idx];
      if (offset > 0 && size > 0 && targetAddr >= 0x80000000) {
        const destOffset = targetAddr - 0x80000000;
        if (destOffset + size <= this.ram.length && offset + size <= sourceBytes.length) {
          this.ram.set(sourceBytes.subarray(offset, offset + size), destOffset);
          this.emitLog('MEMORY', `Loaded Data[${idx}]: 0x${targetAddr.toString(16)} (size: ${size} bytes)`, 'info');
        }
      }
    });

    // 3. Clear BSS
    if (header.bssAddress >= 0x80000000 && header.bssSize > 0) {
      const bssOffset = header.bssAddress - 0x80000000;
      const bssEnd = Math.min(bssOffset + header.bssSize, this.ram.length);
      this.ram.fill(0, bssOffset, bssEnd);
      this.emitLog('MEMORY', `Initialized BSS section at 0x${header.bssAddress.toString(16)} (${header.bssSize} bytes)`, 'info');
    }

    // 4. Set Entry Point
    this.entryPoint = header.entryPoint >= 0x80000000 ? header.entryPoint : 0x80003150;
    this.pc = this.entryPoint;
    this.emitLog('CPU', `PowerPC Gekko CPU initialized. Entry point set to 0x${this.pc.toString(16).toUpperCase()}`, 'success');

    return true;
  }

  // Execute a batch of PowerPC instructions
  public step(instructionCount: number = 1000): number {
    let executed = 0;

    while (executed < instructionCount && !this.isHalted) {
      const inst = this.readUint32(this.pc);
      if (inst === 0x00000000) {
        // NOP or padding
        this.pc += 4;
        executed++;
        continue;
      }

      const op = (inst >>> 26) & 0x3F;
      const rd = (inst >>> 21) & 0x1F;
      const ra = (inst >>> 16) & 0x1F;
      const rb = (inst >>> 11) & 0x1F;
      const d = (inst << 16) >> 16; // signed 16-bit
      const uimm = inst & 0xFFFF; // unsigned 16-bit

      let nextPc = this.pc + 4;

      switch (op) {
        case 14: // addi (or li if ra === 0)
          this.gpr[rd] = (ra === 0 ? 0 : this.gpr[ra]) + d;
          break;

        case 15: // addis (or lis if ra === 0)
          this.gpr[rd] = (ra === 0 ? 0 : this.gpr[ra]) + (d << 16);
          break;

        case 24: // ori (or nop if rd=0, ra=0, uimm=0)
          this.gpr[ra] = this.gpr[rd] | uimm;
          break;

        case 25: // oris
          this.gpr[ra] = this.gpr[rd] | (uimm << 16);
          break;

        case 31: {
          const subOp = (inst >>> 1) & 0x3FF;
          if (subOp === 444) {
            // mr / or
            this.gpr[ra] = this.gpr[rd] | this.gpr[rb];
          } else if (subOp === 266) {
            // add
            this.gpr[rd] = this.gpr[ra] + this.gpr[rb];
          } else if (subOp === 40) {
            // subf
            this.gpr[rd] = this.gpr[rb] - this.gpr[ra];
          } else if (subOp === 16) {
            // bclr (blr)
            nextPc = this.lr;
          }
          break;
        }

        case 32: { // lwz
          const effectiveAddr = (ra === 0 ? 0 : this.gpr[ra]) + d;
          this.gpr[rd] = this.readUint32(effectiveAddr);
          break;
        }

        case 36: { // stw
          const effectiveAddr = (ra === 0 ? 0 : this.gpr[ra]) + d;
          this.writeUint32(effectiveAddr, this.gpr[rd]);
          break;
        }

        case 18: { // b (Branch)
          const li = ((inst & 0x03FFFFFC) << 6) >> 6;
          const aa = inst & 0x02;
          const lk = inst & 0x01;
          if (lk) this.lr = this.pc + 4;
          nextPc = aa ? li : this.pc + li;
          break;
        }

        case 16: { // bc (Branch Conditional)
          const bd = ((inst & 0xFFFC) << 16) >> 16;
          const lk = inst & 0x01;
          if (lk) this.lr = this.pc + 4;
          // Simplified branch condition
          nextPc = this.pc + bd;
          break;
        }

        default:
          // Unhandled opcode - advance PC
          break;
      }

      this.pc = nextPc >>> 0;
      executed++;
      this.totalInstructionsExecuted++;
    }

    return executed;
  }
}
