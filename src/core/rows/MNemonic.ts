import { MnemonicInstanceType } from '../../types'

const bip39 = require('bip39')

const mnemonicInstance = (
  mnemonic: string | string[] | Record<string, any>,
): MnemonicInstanceType => {
  let mnemonicString

  if (typeof mnemonic === 'string') {
    mnemonicString = mnemonic
  } else if (Array.isArray(mnemonic)) {
    mnemonicString = mnemonic.join(' ')
  } else if (typeof mnemonic === 'object' && mnemonic !== null) {
    mnemonicString = Object.values(mnemonic).join(' ')
  } else {
    throw new Error('Invalid mnemonic format')
  }

  return {
    toAlphabetObject: (): Record<string, string> => {
      const words = mnemonicString.split(' ')
      const newObject: Record<string, string> = {}
      const alphabet = 'abcdefghijklmnopqrstuvwxyz'
      words.forEach((key, index) => {
        if (index < alphabet.length) {
          newObject[alphabet[index]] = key
        } else {
          throw new Error('Alphabet limit exceeded')
        }
      })
      return newObject
    },
    toObject: (): Record<string, string> => {
      const words = mnemonicString.split(' ')
      const newObject: Record<string, string> = {}
      words.forEach((key, index) => {
        newObject[index] = key
      })
      return newObject
    },
    toArray: (): string[] => {
      return mnemonicString.split(' ')
    },
    toString: (): string => {
      return mnemonicString
    },
    validate: (): boolean => {
      return bip39.validateMnemonic(mnemonicString)
    },
  }
}

const randomGenerator = () => {
  let mnemonic = bip39.generateMnemonic()
  return mnemonicInstance(mnemonic)
}

const MNemonic = {
  randomGenerator,
  mnemonicInstance,
}

export default MNemonic
