import { MnemonicInstanceType } from '../../types'
const HDWallet = require('ethereum-hdwallet')

const walletInstance = (mnemonic: MnemonicInstanceType) => {
  const mnemonicInstance = mnemonic

  return {
    eth: (dirve: string = "m/44'/60'/0'/0/0") => {
      let hdwallet = HDWallet.fromMnemonic(mnemonicInstance.toString())
      return {
        address: () => {
          return `0x${hdwallet.derive(dirve).getAddress().toString('hex')}`
        },
        privateKey: () => {
          return `0x${hdwallet.derive(dirve).getPrivateKey().toString('hex')}`
        },
      }
    },
    btc: (derivePath: string = "m/44'/0'/0'/0/0") => {
      return {
        address: () => '', // Bitcoin Adresi
        privateKey: () => '',
      }
    },
    trx: () => {
      return {
        address: () => {
          return 'test'
        },
        privateKey: () => {
          return 'test'
        },
      }
    },
  }
}

const Wallet = {
  walletInstance,
}

export default Wallet
