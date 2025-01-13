// ERC20 Standard Interface
export const ERC20_ABI = [
  // Read-only functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',

  // State-changing functions
  'function transfer(address to, uint256 value) returns (bool)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function transferFrom(address from, address to, uint256 value) returns (bool)',

  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
]

// ERC721 Standard Interface (NFT)
export const ERC721_ABI = [
  // Read-only functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',

  // State-changing functions
  'function approve(address to, uint256 tokenId)',
  'function setApprovalForAll(address operator, bool approved)',
  'function transferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId)',
  'function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)',

  // Events
  'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
  'event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)',
  'event ApprovalForAll(address indexed owner, address indexed operator, bool approved)',
]

// ERC1155 Standard Interface (Multi Token)
export const ERC1155_ABI = [
  // Read-only functions
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
  'function isApprovedForAll(address account, address operator) view returns (bool)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
  'function uri(uint256 id) view returns (string)',

  // State-changing functions
  'function setApprovalForAll(address operator, bool approved)',
  'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
  'function safeBatchTransferFrom(address from, address to, uint256[] ids, uint256[] amounts, bytes data)',

  // Events
  'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)',
  'event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)',
  'event ApprovalForAll(address indexed account, address indexed operator, bool approved)',
  'event URI(string value, uint256 indexed id)',
]

// ERC777 Standard Interface
export const ERC777_ABI = [
  // Read-only functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address holder) view returns (uint256)',
  'function granularity() view returns (uint256)',
  'function defaultOperators() view returns (address[])',
  'function isOperatorFor(address operator, address tokenHolder) view returns (bool)',

  // State-changing functions
  'function send(address recipient, uint256 amount, bytes data)',
  'function burn(uint256 amount, bytes data)',
  'function authorizeOperator(address operator)',
  'function revokeOperator(address operator)',
  'function operatorSend(address sender, address recipient, uint256 amount, bytes data, bytes operatorData)',
  'function operatorBurn(address account, uint256 amount, bytes data, bytes operatorData)',

  // Events
  'event Sent(address indexed operator, address indexed from, address indexed to, uint256 amount, bytes data, bytes operatorData)',
  'event Minted(address indexed operator, address indexed to, uint256 amount, bytes data, bytes operatorData)',
  'event Burned(address indexed operator, address indexed from, uint256 amount, bytes data, bytes operatorData)',
  'event AuthorizedOperator(address indexed operator, address indexed tokenHolder)',
  'event RevokedOperator(address indexed operator, address indexed tokenHolder)',
]

// Common Token Events (for topic filtering)
export const TOKEN_EVENTS = {
  ERC20_TRANSFER: {
    name: 'Transfer',
    signature: 'Transfer(address,address,uint256)',
    topic: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  },
  ERC721_TRANSFER: {
    name: 'Transfer',
    signature: 'Transfer(address,address,uint256)',
    topic: '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  },
  ERC1155_TRANSFER_SINGLE: {
    name: 'TransferSingle',
    signature: 'TransferSingle(address,address,address,uint256,uint256)',
    topic: '0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62',
  },
  ERC1155_TRANSFER_BATCH: {
    name: 'TransferBatch',
    signature: 'TransferBatch(address,address,address,uint256[],uint256[])',
    topic: '0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb',
  },
}

// Interface IDs for ERC165 support checking
export const INTERFACE_IDS = {
  ERC165: '0x01ffc9a7',
  ERC721: '0x80ac58cd',
  ERC1155: '0xd9b67a26',
  ERC20: '0x36372b07',
  ERC777: '0xe58e113c',
}

// Additional utility ABIs
export const ERC165_ABI = [
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
]

// Minimal ABI for detecting token type
export const MINIMAL_TOKEN_ABI = [
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
]

// Export all together as a constant
export const ABIS = {
  ERC20: ERC20_ABI,
  ERC721: ERC721_ABI,
  ERC1155: ERC1155_ABI,
  ERC777: ERC777_ABI,
  ERC165: ERC165_ABI,
  MINIMAL: MINIMAL_TOKEN_ABI,
}

// Helper function to get ABI by token type
export function getAbiForTokenType(tokenType: string): string[] {
  switch (tokenType.toUpperCase()) {
    case 'ERC20':
      return ERC20_ABI
    case 'ERC721':
      return ERC721_ABI
    case 'ERC1155':
      return ERC1155_ABI
    case 'ERC777':
      return ERC777_ABI
    default:
      return MINIMAL_TOKEN_ABI
  }
}
