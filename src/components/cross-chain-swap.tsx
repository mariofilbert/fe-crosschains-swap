"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  Clock,
  Copy,
  ExternalLink,
  LogOut,
  RefreshCw,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// new imports
import { useAccount, useBalance, useDisconnect, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { mainnet, arbitrum, base, polygon, optimism } from "wagmi/chains";
import {
  keccak256,
  toHex,
  stringToBytes,
  erc20Abi,
  pad,
  encodeAbiParameters,
  hexToBytes,
} from "viem";

// tambahan
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import SpokeABI from "@/abis/SpokeABI.json";

import CustomConnectButton from "@/components/ui/custom-connectbutton";

// Define types for our data
interface Token {
  symbol: string;
  name: string;
  address: string;
  logoUrl: string;
  balance?: string;
  price?: number;
}

interface Chain {
  id: number;
  name: string;
  logoUrl: string;
}

// interface WalletProvider {
//   id: string;
//   name: string;
//   logoUrl: string;
//   description: string;
// }

// Sample data
const chains: Chain[] = [
  {
    id: mainnet.id,
    name: "Ethereum",
    logoUrl: "/placeholder.svg?height=24&width=24",
  },
  {
    id: arbitrum.id,
    name: "Arbitrum",
    logoUrl: "/placeholder.svg?height=24&width=24",
  },
  {
    id: base.id,
    name: "Base",
    logoUrl: "/placeholder.svg?height=24&width=24",
  },
  {
    id: polygon.id,
    name: "Polygon",
    logoUrl: "/placeholder.svg?height=24&width=24",
  },
  {
    id: optimism.id,
    name: "Optimism",
    logoUrl: "/placeholder.svg?height=24&width=24",
  },
];

const tokens: Token[] = [
  {
    symbol: "ETH",
    name: "Ethereum",
    address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    logoUrl: "/placeholder.svg?height=24&width=24",
    balance: "0.5",
    price: 3500,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    logoUrl: "/placeholder.svg?height=24&width=24",
    balance: "1000",
    price: 1,
  },
  {
    symbol: "USDT",
    name: "Tether",
    address: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    logoUrl: "/placeholder.svg?height=24&width=24",
    balance: "500",
    price: 1,
  },
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    logoUrl: "/placeholder.svg?height=24&width=24",
    balance: "0.01",
    price: 62000,
  },
];

// const walletProviders: WalletProvider[] = [
//   {
//     id: 'metamask',
//     name: 'MetaMask',
//     logoUrl: '/placeholder.svg?height=40&width=40',
//     description: 'Connect to your MetaMask Wallet',
//   },
//   {
//     id: 'walletconnect',
//     name: 'WalletConnect',
//     logoUrl: '/placeholder.svg?height=40&width=40',
//     description: 'Scan with WalletConnect to connect',
//   },
//   {
//     id: 'coinbase',
//     name: 'Coinbase Wallet',
//     logoUrl: '/placeholder.svg?height=40&width=40',
//     description: 'Connect to your Coinbase Wallet',
//   },
//   {
//     id: 'trustwallet',
//     name: 'Trust Wallet',
//     logoUrl: '/placeholder.svg?height=40&width=40',
//     description: 'Connect to your Trust Wallet',
//   },
// ];

export default function CrossChainSwap() {
  const [sourceChain, setSourceChain] = useState<Chain>(chains[1]); // Arbitrum
  const [destinationChain, setDestinationChain] = useState<Chain>(chains[2]); // Base
  const [sourceToken, setSourceToken] = useState<Token>(tokens[0]); // ETH
  const [destinationToken, setDestinationToken] = useState<Token>(tokens[0]); // ETH
  const [sourceAmount, setSourceAmount] = useState<string>("0.1");
  const [destinationAmount, setDestinationAmount] = useState<string>("0.099");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  // const [walletAddress, setWalletAddress] = useState<string>('');
  // const [walletBalance, setWalletBalance] = useState<string>('0.0');
  // const [isConnectDialogOpen, setIsConnectDialogOpen] = useState<boolean>(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] =
    useState<boolean>(false);
  const [isSwitchHovered, setIsSwitchHovered] = useState<boolean>(false);

  const { address, isConnected, chain: currentChain } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balanceData } = useBalance({
    address: address,
  });
  const { switchChain } = useSwitchChain();

  // Calculate the exchange rate
  const exchangeRate = 0.99; // 1% fee example
  const estimatedGas = "0.001 ETH";
  const estimatedTime = "15 min";

  // const handleSwap = () => {
  //   if (!isWalletConnected) {
  //     setIsConnectDialogOpen(true);
  //     return;
  //   }

  //   setIsLoading(true);
  //   // Simulate API call
  //   setTimeout(() => {
  //     setIsLoading(false);
  //   }, 2000);
  // };

  // ================================================
  // ================================================

  const { writeContract, data, isPending } = useWriteContract();

  const {
    isSuccess,
    isLoading: isLoadingSwap,
    isError,
  } = useWaitForTransactionReceipt({
    hash: data,
  });

  const { address: wallet } = useAccount();

  const handleSwap = async () => {
    // struct OrderData {
    // bytes32 sender;
    // bytes32 recipient;
    // bytes32 inputToken;
    // bytes32 outputToken;
    // uint256 amountIn;
    // uint256 amountOut;
    // uint256 senderNonce;
    // uint32 originDomain;
    // uint32 destinationDomain;
    // bytes32 destinationSettler;
    // uint32 fillDeadline;
    // bytes data;

    console.log(wallet);

    const orderData = encodeAbiParameters(
      [
        { name: "sender", type: "bytes32" },
        { name: "recipient", type: "bytes32" },
        { name: "inputToken", type: "bytes32" },
        { name: "outputToken", type: "bytes32" },
        { name: "amountIn", type: "uint256" },
        { name: "amountOut", type: "uint256" },
        { name: "senderNonce", type: "uint256" },
        { name: "originDomain", type: "uint32" },
        { name: "destinationDomain", type: "uint32" },
      ],
      [
        pad(wallet),
        pad(wallet),
        pad("0x930a3eE87F82134510a272655dfC0A7ae299B2Af"),
        pad("0x930a3eE87F82134510a272655dfC0A7ae299B2Af"),
        BigInt(1000000000000000000),
        BigInt(990000000000000000),
        BigInt(0),
        1000,
        10001,
      ]
    );

    console.log(orderData);

    await writeContract({
      address: "0x99b0f318977b115293535Bf484ee406EaBd2c4F1",
      abi: SpokeABI,
      functionName: "open",
      value: BigInt(0),
      args: [
        [
          Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          keccak256(toHex("orderData")),
          orderData,
        ],
      ],
    });

    console.log("handleSwap");
  };

  // ================================================
  // ================================================

  // const handleSwap = () => {
  //   if (!isConnected) {
  //     return;
  //   }

  //   setIsLoading(true);
  //   // Simulate API call
  //   setTimeout(() => {
  //     setIsLoading(false);
  //   }, 2000);
  // };

  const handleSourceAmountChange = (value: string) => {
    setSourceAmount(value);
    // Calculate destination amount based on exchange rate
    const numValue = Number.parseFloat(value) || 0;
    setDestinationAmount((numValue * exchangeRate).toFixed(6));
  };

  const handleMaxClick = () => {
    if (sourceToken.balance) {
      setSourceAmount(sourceToken.balance);
      const numValue = Number.parseFloat(sourceToken.balance) || 0;
      setDestinationAmount((numValue * exchangeRate).toFixed(6));
    }
  };

  const handleSourceChainChange = (chain: Chain) => {
    setSourceChain(chain);
    if (isConnected) {
      switchChain({ chainId: chain.id });
    }
  };

  const getTokenBalance = (token: Token) => {
    // If connected and current chain matches source chain, use Wagmi balance
    if (isConnected && currentChain?.id === sourceChain.id) {
      // Convert Wagmi balance to token's decimal representation
      return balanceData?.decimals || "0.0";
    }
    // Fallback to token's predefined balance or "0.0"
    return token.balance || "0.0";
  };

  /*************  ✨ Codeium Command ⭐  *************/
  /**
   * Switches the source and destination chains and tokens.
   *
   * Used when the user wants to swap the two chains/tokens.
   */
  /******  0a8bfbc7-07cf-4baf-9095-651909407a4a  *******/
  const switchChains = () => {
    const tempChain = sourceChain;
    setSourceChain(destinationChain);
    setDestinationChain(tempChain);

    // Also switch tokens
    const tempToken = sourceToken;
    setSourceToken(destinationToken);
    setDestinationToken(tempToken);
  };

  // const connectWallet = (providerId: string) => {
  //   setIsLoading(true);

  //   // Simulate wallet connection
  //   setTimeout(() => {
  //     setIsWalletConnected(true);
  //     setWalletAddress('0x1234...5678');
  //     setWalletBalance('1.25 ETH');
  //     setIsLoading(false);
  //     setIsConnectDialogOpen(false);
  //   }, 1500);
  // };

  // const disconnectWallet = () => {
  //   setIsWalletConnected(false);
  //   setWalletAddress('');
  //   setWalletBalance('0.0');
  // };

  // const copyAddress = () => {
  //   navigator.clipboard.writeText('0x1234567890abcdef1234567890abcdef12345678');
  //   // You could add a toast notification here
  // };

  // const shortenAddress = (addr?: `0x${string}`, chars = 4): string => {
  //   if (!addr || addr.length < chars * 2 + 2) return addr ?? '';
  //   return `${addr.slice(0, chars + 2)}...${addr.slice(-chars)}`;
  // };

  // const isSwapButtonDisabled =
  //   isLoading || !sourceAmount || Number.parseFloat(sourceAmount) <= 0;

  return (
    <Card className="w-full max-w-md border-slate-700 bg-slate-800 text-slate-100 shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold">Swap</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog
            open={isHistoryDialogOpen}
            onOpenChange={setIsHistoryDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-slate-100 hover:bg-slate-700"
              >
                <Clock className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700 text-slate-100">
              <DialogHeader>
                <DialogTitle>Transaction History</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Your recent cross-chain swap transactions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {isConnected ? (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-slate-700 p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <span>0.1 ETH → 0.099 ETH</span>
                            <span className="text-xs text-slate-400">
                              Arbitrum → Base
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-green-400">
                          Completed
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        2 hours ago •{" "}
                        <a href="#" className="text-primary">
                          View on Explorer
                        </a>
                      </div>
                    </div>
                    <div className="rounded-lg bg-slate-700 p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <span>500 USDC → 499 USDC</span>
                            <span className="text-xs text-slate-400">
                              Ethereum → Polygon
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-green-400">
                          Completed
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Yesterday •{" "}
                        <a href="#" className="text-primary">
                          View on Explorer
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="mb-4">
                      Connect your wallet to view transaction history
                    </p>
                    {/* <Button
                      onClick={() => {
                        setIsHistoryDialogOpen(false);
                        setIsConnectDialogOpen(true);
                      }}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      Connect Wallet
                    </Button> */}
                    <div className="mt-4">
                      <CustomConnectButton />
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* {isConnected ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-slate-500 text-xs h-8 px-3"
                >
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    {shortenAddress(address)}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-slate-700 border-slate-600">
                <div className="px-2 py-1.5 text-xs text-slate-400">
                  Connected Wallet
                </div>
                <DropdownMenuSeparator className="bg-slate-600" />
                <div className="px-2 py-1.5">
                  <div className="font-medium">{address}</div>
                  <div className="text-sm text-slate-400">
                    Balance: {Number(balanceData?.decimals).toFixed(4)}{' '}
                    {balanceData?.symbol}
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-slate-600" />
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer hover:bg-slate-600"
                  onClick={copyAddress}
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy Address</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer hover:bg-slate-600 text-red-400"
                  onClick={() => disconnect()}
                >
                  <LogOut className="h-4 w-4" />
                  <span>Disconnect</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Dialog
              open={isConnectDialogOpen}
              onOpenChange={setIsConnectDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 transition-colors duration-200 hover:scale-[1.02]"
                  onClick={() => setIsConnectDialogOpen(true)}
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700 text-slate-100">
                <DialogHeader>
                  <DialogTitle>Connect Wallet</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Connect your wallet to start swapping tokens across chains.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {walletProviders.map((provider) => (
                    <Button
                      key={provider.id}
                      variant="outline"
                      className="flex items-center justify-start gap-4 h-16 px-4 bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-slate-500"
                      onClick={() => connectWallet(provider.id)}
                      disabled={isLoading}
                    >
                      <Image
                        src={provider.logoUrl || '/placeholder.svg'}
                        alt={provider.name}
                        width={40}
                        height={40}
                        className="rounded-md"
                      />
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{provider.name}</span>
                        <span className="text-xs text-slate-400">
                          {provider.description}
                        </span>
                      </div>
                      {isLoading && (
                        <RefreshCw className="ml-auto h-4 w-4 animate-spin" />
                      )}
                    </Button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )} */}

          <ConnectButton showBalance={false} accountStatus="address" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {/* Source Chain and Token */}
        <div className="rounded-xl bg-slate-700 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">From</div>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-slate-400">
                Balance: {isConnected ? sourceToken.balance : "0.0"}{" "}
                {sourceToken.symbol}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-primary hover:bg-slate-600"
                onClick={handleMaxClick}
                disabled={!isConnected}
              >
                MAX
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={sourceAmount}
              onChange={(e) => handleSourceAmountChange(e.target.value)}
              className="border-none bg-transparent text-2xl font-medium focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
              placeholder="0.0"
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-slate-600 border-slate-600 hover:bg-slate-500 hover:border-slate-500 flex items-center gap-2"
                >
                  <div className="flex items-center">
                    <Image
                      src={sourceToken.logoUrl || "/placeholder.svg"}
                      alt={sourceToken.symbol}
                      width={20}
                      height={20}
                      className="mr-2 rounded-full"
                    />
                    <span>{sourceToken.symbol}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-slate-700 border-slate-600">
                {tokens.map((token) => (
                  <DropdownMenuItem
                    key={token.address}
                    onClick={() => setSourceToken(token)}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer hover:bg-slate-600",
                      sourceToken.address === token.address && "bg-slate-600"
                    )}
                  >
                    <Image
                      src={token.logoUrl || "/placeholder.svg"}
                      alt={token.symbol}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                    <div className="flex flex-col">
                      <span>{token.symbol}</span>
                      <span className="text-xs text-slate-400">
                        {token.name}
                      </span>
                    </div>
                    <div className="ml-auto text-xs text-slate-400">
                      {isConnected ? token.balance : "0.0"}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between bg-slate-600 hover:bg-slate-500 text-left h-8 px-3"
              >
                <div className="flex items-center">
                  <Image
                    src={sourceChain.logoUrl || "/placeholder.svg"}
                    alt={sourceChain.name}
                    width={16}
                    height={16}
                    className="mr-2 rounded-full"
                  />
                  <span className="text-sm">{sourceChain.name}</span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-700 border-slate-600">
              {chains.map((chain) => (
                <DropdownMenuItem
                  key={chain.id}
                  onClick={() => setSourceChain(chain)}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer hover:bg-slate-600",
                    sourceChain.id === chain.id && "bg-slate-600"
                  )}
                >
                  <Image
                    src={chain.logoUrl || "/placeholder.svg"}
                    alt={chain.name}
                    width={16}
                    height={16}
                    className="rounded-full"
                  />
                  <span>{chain.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Switch Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-8 w-8 bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600 transition-all duration-200"
            onClick={switchChains}
            onMouseEnter={() => setIsSwitchHovered(true)}
            onMouseLeave={() => setIsSwitchHovered(false)}
          >
            {isSwitchHovered ? (
              <ArrowUp className="h-4 w-4" />
            ) : (
              <ArrowDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Destination Chain and Token */}
        <div className="rounded-xl bg-slate-700 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">To (estimated)</div>
          </div>

          <div className="flex items-center space-x-2">
            <Input
              type="number"
              value={destinationAmount}
              readOnly
              className="border-none bg-transparent text-2xl font-medium focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto"
              placeholder="0.0"
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-slate-600 border-slate-600 hover:bg-slate-500 hover:border-slate-500 flex items-center gap-2"
                >
                  <div className="flex items-center">
                    <Image
                      src={destinationToken.logoUrl || "/placeholder.svg"}
                      alt={destinationToken.symbol}
                      width={20}
                      height={20}
                      className="mr-2 rounded-full"
                    />
                    <span>{destinationToken.symbol}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-slate-700 border-slate-600">
                {tokens.map((token) => (
                  <DropdownMenuItem
                    key={token.address}
                    onClick={() => setDestinationToken(token)}
                    className={cn(
                      "flex items-center gap-2 cursor-pointer hover:bg-slate-600",
                      destinationToken.address === token.address &&
                        "bg-slate-600"
                    )}
                  >
                    <Image
                      src={token.logoUrl || "/placeholder.svg"}
                      alt={token.symbol}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                    <div className="flex flex-col">
                      <span>{token.symbol}</span>
                      <span className="text-xs text-slate-400">
                        {token.name}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between bg-slate-600 hover:bg-slate-500 text-left h-8 px-3"
              >
                <div className="flex items-center">
                  <Image
                    src={destinationChain.logoUrl || "/placeholder.svg"}
                    alt={destinationChain.name}
                    width={16}
                    height={16}
                    className="mr-2 rounded-full"
                  />
                  <span className="text-sm">{destinationChain.name}</span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-700 border-slate-600">
              {chains.map((chain) => (
                <DropdownMenuItem
                  key={chain.id}
                  onClick={() => setDestinationChain(chain)}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer hover:bg-slate-600",
                    destinationChain.id === chain.id && "bg-slate-600"
                  )}
                >
                  <Image
                    src={chain.logoUrl || "/placeholder.svg"}
                    alt={chain.name}
                    width={16}
                    height={16}
                    className="rounded-full"
                  />
                  <span>{chain.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Swap Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Rate</span>
            <span>
              1 {sourceToken.symbol} ≈ {exchangeRate} {destinationToken.symbol}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Estimated Gas</span>
            <span>{estimatedGas}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Estimated Time</span>
            <span>{estimatedTime}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Route</span>
            <div className="flex items-center">
              <span>{sourceChain.name}</span>
              <ArrowRight className="h-3 w-3 mx-1" />
              <span>{destinationChain.name}</span>
              <Button
                variant="link"
                size="sm"
                className="h-4 p-0 ml-1 text-primary"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        {/* {isConnected ? (
          <Button
            className={cn(
              'w-full bg-primary text-primary-foreground h-12 text-base font-medium',
              !isSwapButtonDisabled &&
                'hover:bg-primary/90 transition-colors duration-200 hover:scale-[1.02]'
            )}
            disabled={isSwapButtonDisabled}
            onClick={handleSwap}
          >
            {isLoading ? (
              <div className="flex items-center">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : Number.parseFloat(sourceAmount) <= 0 ? (
              'Enter an amount'
            ) : (
              'Swap'
            )}
          </Button>
        ) : (
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-medium transition-colors duration-200 hover:scale-[1.02]"
            // onClick={() => setIsConnectDialogOpen(true)}
          >
            <Wallet className="mr-2 h-5 w-5" />
            Connect Wallet
          </Button>
        )} */}
        <Button
          className="w-full"
          disabled={!isConnected || isLoading}
          onClick={handleSwap}
        >
          {!isConnected ? "Connect Wallet" : isLoading ? "Swapping..." : "Swap"}
        </Button>
        <Button className="w-full" onClick={handleSwap}>
          {isPending ? "Swapping..." : "Swap Now"}
        </Button>
        {isLoadingSwap ? "Loading Swapping..." : ""}
      </CardFooter>
    </Card>
  );
}
