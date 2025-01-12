import { ContainerInstanceType, MnemonicInstanceType } from '../../types'
import Mnemonic from './MNemonic'

const containerInstance = (
  mnemonic: MnemonicInstanceType,
  containerId?: string,
): ContainerInstanceType => {
  const factorialCache: Record<number, number> = {}

  function factorial(num: number): number {
    if (num <= 1) return 1
    if (factorialCache[num]) return factorialCache[num]
    factorialCache[num] = num * factorial(num - 1)
    return factorialCache[num]
  }

  let objectMnemonic = mnemonic.toAlphabetObject()

  return {
    permutations(): number {
      return (factorial(
        Object.keys(objectMnemonic).length,
      ) as unknown) as number
    },
    getPermutationByIndex(index: number): MnemonicInstanceType {
      const keys = Object.keys(objectMnemonic)
      const n = keys.length

      if (index < 0 || (((index >= factorial(n)) as unknown) as number)) {
        throw new Error('Index out of range')
      }

      const result: string[] = []
      const availableKeys = [...keys]
      const factorials = Array.from({ length: n }, (_, i) => factorial(i))

      let remainingIndex = index

      for (let i = n - 1; i >= 0; i--) {
        const selectedIndex = Math.floor(remainingIndex / factorials[i])
        result.push(availableKeys[selectedIndex])
        availableKeys.splice(selectedIndex, 1)
        remainingIndex %= factorials[i]
      }

      let newMnemonic: Record<string, string> = {}

      for (let i = 0; i < result.length; i++) {
        newMnemonic[result[i]] = objectMnemonic[result[i]]
      }

      return Mnemonic.mnemonicInstance(newMnemonic)
    },
    getMnemonic(): MnemonicInstanceType {
      return mnemonic
    },
    getContainerId(): string {
      return containerId ?? ''
    },
  }
}

const Container = {
  containerInstance,
}

export default Container
