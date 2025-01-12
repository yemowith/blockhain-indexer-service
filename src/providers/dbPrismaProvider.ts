import dbClient from '../core/clients/db-prisma'

const contract = {
  create: async (address: string, isERC20: string): Promise<any> => {},
}
const dbPrismaProvider = { contract }

export default dbPrismaProvider
