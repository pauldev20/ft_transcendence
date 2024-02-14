import { IncomingMessage, ServerResponse } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import { Server } from "Socket.IO";
import crypto from 'crypto';
import { contract_address } from "@/app/tournamentManager";
import { ethers } from 'ethers';
import tournamentAbi from '@/public/tournamentManager_abi.json';
import { matchmaking, tournamentHandler } from "./matchmaking";

/* -------------------------------------------------------------------------- */
/*                                  Interface                                 */
/* -------------------------------------------------------------------------- */
interface SocketApiResponse extends NextApiResponse {
	socket: ServerResponse<IncomingMessage>['socket'] & {
	  server?: {
		io?: Server | undefined;
	  };
	};
}

interface SocketData {
	getElo: number;
	address: number;
}

// TODO: Maybe replacing the Rematch button with a continue button in tournaments / div modal

// FIXME: (Fix documentation)

const provider = new ethers.providers.JsonRpcProvider("https://sepolia.base.org");
export const contract = new ethers.Contract(contract_address, tournamentAbi, provider);

/* -------------------------------------------------------------------------- */
/*                                   Handler                                  */
/* -------------------------------------------------------------------------- */
const SocketHandler = async (req: NextApiRequest, res: SocketApiResponse): Promise<void> => {
	// const eloScore = await contract.getPlayerRankedElo("address") as number;
	// const games = await contract.getTournamentTree(0) as Game[];

	const getElo = async (address: string) => {
		if (address) {
			const eloScore = (await contract.getPlayerRankedElo(address)) as number;
			return (eloScore);
		}
	}

	if (!res.socket.server?.io) {
		const io = new Server(res.socket.server as any);
		res.socket.server!.io = io;
		
		io.on('connection', (socket) => {

			socket.on('WalletAdress', (addressObj: { address: string } | undefined) => {
				if (addressObj) {
					const { address } = addressObj;
					console.log("ADR", address);
					socket.data = {
						walletAddress: address,
						elo: async () => {
							return await getElo(address);
						},
						isInGame: false
					}
					console.log("SET ADDR")
				}
			});

			socket.on('Update-Status', (isInGame: boolean) => {
				socket.data.isInGame = isInGame;
			});

			// socket.on('create-tournaments', async (gameType: string) => {
			// 	const tournamentID = await contract.createTournament(10000000);
			// 	socket.emit('tournament-created', tournamentID);
			// });

			socket.on('tournament', async (tournamentID: number, gameType: string) => {
				const sockets = await io.in(`tournament-${tournamentID}`).fetchSockets();
				tournamentHandler(sockets, tournamentID, gameType);
			});

			socket.on('join-tournament', (tournamentID: number) => {
				console.log("SOCKET JOINED", tournamentID);
				socket.join(`tournament-${tournamentID}`);
				socket.emit(`tournament-${tournamentID}-joined`, tournamentID);
			});

			socket.on('join-queue', async (gameType: string) => {
				socket.join(gameType);
				const sockets = await io.in(gameType).fetchSockets();
				matchmaking({sockets, gameType});
			});

			socket.on('join-game', ( gameId: string, gameType: string, isBot: boolean ) => {
				const room = io.sockets.adapter.rooms.get(gameId);
				const numClients = room ? room.size : 0;
				let maxClients = isBot ? 1 : 2;

				if (gameType === "OneForAll")
					maxClients = isBot ? 3: 4;
				else if (gameType === "Qubic")
					maxClients = isBot ? 2: 3;

				if (numClients < maxClients) {
						socket.join(gameId);
						socket.emit(`room-joined-${gameId}`, numClients);
					if (numClients === maxClients - 1) {
						const topic = `Players-${gameId}`;
						io.to(gameId).emit(`message-${gameId}-${topic}`, "FULL");
					}
				}

				socket.on('disconnect', () => {
					const topic = `player-disconnected-${gameId}`;
					io.to(gameId).emit(`message-${gameId}-${topic}`, gameId);
					socket.disconnect();
					io.in(gameId).disconnectSockets();
				});
			});

			socket.on('create-game', (msg: string) => {
				var id = crypto.randomBytes(20).toString('hex').substring(0, 7);
				socket.emit(`game-created-${msg}`, id);
			});

			socket.on('send-message-to-game', (msg: string, topic: string, gameId: string) => {
				socket.to(gameId).emit(`message-${gameId}-${topic}`, msg);
			});
	  });
	}

	res.end();
};

export default SocketHandler;