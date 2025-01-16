const murmurhash3js = require('murmurhash3js')

export class WalletClassify {
  address: string

  constructor(address: string) {
    this.address = this.remove0xPrefix(address.toLowerCase())
  }

  remove0xPrefix(address: string): string {
    if (address.startsWith('0x')) {
      return address.slice(2)
    }
    return address
  }

  classifyByCharacterRatio(): string {
    const totalLength = this.address.length - 2 // Remove '0x'
    const letters = (this.address.match(/[a-fA-F]/g) || []).length
    const numbers = (this.address.match(/[0-9]/g) || []).length
    const letterRatio = ((letters / totalLength) * 100).toFixed(2)
    const numberRatio = ((numbers / totalLength) * 100).toFixed(2)
    return `L-${letterRatio}-N-${numberRatio}`
  }

  classifyByPrefix(): string {
    const prefix = this.address.substring(0, 4)
    return `P-${prefix}`
  }

  classifyByDensity(): string {
    const letters = (this.address.match(/[a-fA-F]/g) || []).length
    const numbers = (this.address.match(/[0-9]/g) || []).length

    if (letters > numbers) {
      return 'LD'
    } else if (numbers > letters) {
      return 'ND'
    } else {
      return 'BD'
    }
  }

  classifyByLetterRange(): string {
    const aToC = (this.address.match(/[a-cA-C]/g) || []).length
    const dToF = (this.address.match(/[d-fD-F]/g) || []).length
    return `A-C-${aToC}-D-F-${dToF}`
  }

  classifyByPosition(): string {
    const prefixLetters = (this.address.slice(2, 6).match(/[a-fA-F]/g) || [])
      .length
    const suffixNumbers = (this.address.slice(-4).match(/[0-9]/g) || []).length
    return `PL-${prefixLetters}-SN-${suffixNumbers}`
  }

  classifyByMurmurHash(): string {
    const murmurHash = murmurhash3js.x86
      .hash32(this.address, 0)
      .toString()
      .slice(0, 4)
    return `M-${murmurHash}`
  }

  classify() {
    const classifyByCharacterRatio = this.classifyByCharacterRatio()
    const classifyByPrefix = this.classifyByPrefix()
    const classifyByDensity = this.classifyByDensity()
    const classifyByLetterRange = this.classifyByLetterRange()
    const classifyByPosition = this.classifyByPosition()
    const classifyByMurmurHash = this.classifyByMurmurHash()

    return {
      CR: classifyByCharacterRatio,
      P: classifyByPrefix,
      D: classifyByDensity,
      AR: classifyByLetterRange,
      PL: classifyByPosition,
      MH: classifyByMurmurHash,
      address: this.address,
    }
  }
}
