import { Events } from 'discord.js'
import Event from '../types/Event'
import { client } from "../index"

export default new Event({
	name: Events.ClientReady,
	once: true,
	execute(): void {
		// Runs when the bot logs in
		console.log(`Logged in as ${client.user?.tag as string}`)
	},
})