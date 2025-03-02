import { AutocompleteInteraction, CategoryChannel, ChannelType, ChatInputCommandInteraction, Invite, SlashCommandBuilder, TextChannel } from 'discord.js'
import ApplicationCommand from '../types/ApplicationCommand'
import database from '../utils/database'
import embeds from '../utils/embeds'
import format from '../utils/format'
import { findBestMatch } from 'string-similarity'

export default new ApplicationCommand({
	permissions: ["Administrator"],
	data: new SlashCommandBuilder()
		.setName('invite')
		.setDescription('Manage invites')
		.addSubcommand(command => command
			.setName('list')
			.setDescription('list invites')
			.addBooleanOption(option => option
				.setName("showall")
				.setDescription("show all invites? by default expired invites without uses are hidden."))
		)
		.addSubcommand(command => command
			.setName('name')
			.setDescription('Assign a name to an invite')
			.addStringOption(option => option
				.setName('code')
				.setDescription('The invite to edit')
				.setRequired(true)
				.setAutocomplete(true)
			)
			.addStringOption(option => option
				.setName('name')
				.setDescription('the name to assign')
			)
		)

		.addSubcommand(command => command
			.setName('delete')
			.setDescription('permanently and irreversibly deletes an invite')
			.addStringOption(option => option
				.setName('code')
				.setDescription('The invite to delete')
				.setRequired(true)
				.setAutocomplete(true)
			)
		)

		.addSubcommand(command => command
			.setName('create')
			.setDescription('create a new invite.')
			.addStringOption(option => option
				.setName('name')
				.setDescription('name of the invite')
			)
			.addChannelOption(option => option
				.setName('channel')
				.setDescription('the channel to invite to')
			)
			.addIntegerOption(option => option
				.setName('length')
				.setDescription('How long the invite should last. Defaults to forever')
				.addChoices(
					{ name: '30 minutes', value: 60 * 30 },
					{ name: '1 hour', value: 60 * 60 },
					{ name: '6 hours', value: 60 * 60 * 6 },
					{ name: '12 hours', value: 60 * 60 * 12 },
					{ name: '1 day', value: 60 * 60 * 24 },
					{ name: '7 days', value: 60 * 60 * 24 * 7 },
					{ name: 'Forever', value: 0 },
				)
			)
			.addIntegerOption(option => option
				.setName('maxuses')
				.setDescription('Maximum number of uses. Defaults to infinite'))
		),
	async execute(interaction: ChatInputCommandInteraction): Promise<void> {

		switch (interaction.options.getSubcommand()) {
			case 'list': {
				await interaction.reply({ ephemeral: true, embeds: embeds.messageEmbed("listing invites...") })
				const invitelist = await database.get(`.guilds.${interaction.guild.id}.invites`)
				console.log(invitelist)
				var output = ""

				for (let i in invitelist) {
					console.log(i)
					const invite = invitelist[i]
					const code = i
					const name = invite.name ? `${invite.name} - ` : ""
					const hasExpired = invite.expired
					const uses = invite.uses
					const showall = interaction.options.getBoolean("showall")
					console.log(code, name, hasExpired, uses)
					console.log(invite.inviterId)
					const inviter = await interaction.client.users.fetch(invite.inviterId)
					var tempoutput = ``

					if (hasExpired && uses === 0 && !showall) continue


					tempoutput += `${name}\`${code}\`, by \`${format.shittyUsername(inviter)}\` (<@${inviter.id}>),`

					let guildinvite: Invite

					if (!hasExpired) {
						guildinvite = await interaction.guild.invites.fetch(code)
						const createdTimestamp = `<t:${guildinvite.createdTimestamp.toString().slice(0, -3)}>`
						let expiresTimestamp = ``
						if (guildinvite.expiresTimestamp) {
							expiresTimestamp = `<t:${await guildinvite.expiresTimestamp.toString().slice(0, -3)}>`
						} else {
							expiresTimestamp = `never`
						}
						tempoutput += `at ${createdTimestamp}, till ${expiresTimestamp}, to <#${guildinvite.channelId}>,`
					}

					tempoutput += `uses: ${uses}`
					if (!hasExpired) {
						guildinvite = await interaction.guild.invites.fetch(code)
						console.log(guildinvite)
						var maxUses = guildinvite.maxUses.toString()
						if (maxUses == "0") maxUses = `∞`
						tempoutput += `/${maxUses}`
					}
					if (hasExpired) {
						output += `\n~~${tempoutput}~~`
					} else {
						output += `\n${tempoutput}`
					}

				}

				//output += `\nInvites marked as [-] have expired.`
				let messages = format.splitMessage(output, 1900, "\n")
				for (let i = 0, len = messages.length; i < len; i++) {
					interaction.followUp({ ephemeral: true, content: messages[i], allowedMentions: { repliedUser: false, users: [] } })
				}

				break
			}
			case 'name': {
				const guild = interaction.guild
				const code = interaction.options.getString('code')
				const name = interaction.options.getString('name')

				if (!await database.get(`.guilds.${guild.id}.invites.${code}`)) {
					interaction.reply({ ephemeral: true, embeds: embeds.warningEmbed(`Invalid Invite`) })
					return
				}
				database.set(`.guilds.${guild.id}.invites.${code}.name`, name)
				interaction.reply({ ephemeral: true, embeds: embeds.successEmbed(`Invite Renamed`, `Invite \`${code}\` renamed to \`${name}\``) })

				break
			}
			case 'delete': {
				const guild = interaction.guild
				const code = interaction.options.getString('code')
				const invites = await interaction.guild.invites.fetch()

				console.log(code)


				const invite = invites.find(invite => invite.code === code)
				if (!invite) {
					interaction.reply({ ephemeral: true, embeds: embeds.warningEmbed(`Invalid Invite`) })
					return
				}
				if (!invite.deletable) {
					interaction.reply({ ephemeral: true, embeds: embeds.warningEmbed(`Invite could not be deleted.`, `Invite \`${code}\` couldn't be deleted.\nDoes it not exist or do I not have permission?`) })
					return
				}

				invite.delete()
				interaction.reply({ ephemeral: true, embeds: embeds.successEmbed(`Invite Deleted`, `Invite \`${code}\` deleted`) })

				break

			}

			case 'create': {
				const name = interaction.options.getString('name')
				const channel = interaction.options.getChannel('channel') || await interaction.guild.channels.fetch(interaction.guild.systemChannelId)
				const length = interaction.options.getInteger('length') || 0
				const maxuses = interaction.options.getInteger('maxuses') || 0

				if (channel.type == ChannelType.GuildCategory ||
					channel.type == ChannelType.GuildDirectory ||
					channel.type == ChannelType.PublicThread ||
					channel.type == ChannelType.PrivateThread) {
					await interaction.reply({ ephemeral: true, embeds: embeds.warningEmbed("The channel you selected is of an invalid type.") })
				}

				(channel as TextChannel).createInvite({ unique: true, maxAge: length, maxUses: maxuses, reason: "invite create command" })
					.then(async invite => {
						console.log(`Created an invite with a code of ${invite.code}`)
						console.log(invite)
						if (name) {
							// the database entry will be created because the event inviteCreate is emitted
							await database.set(`.guilds.${interaction.guild.id}.invites.${invite.code}.name`, name)
							await interaction.reply({ ephemeral: true, embeds: embeds.successEmbed(`Created Invite`, `Created Invite with name \`${name}\`, to channel ${channel}.`) })
						} else {
							await interaction.reply({ ephemeral: true, embeds: embeds.successEmbed(`Created Invite`, `Created Invite to channel ${channel}.`) })
						}
						await interaction.followUp({ ephemeral: true, content: `https://discord.gg/${invite.code}` })
					})
				break
			}
			default: {
				break
			}
		}
	},
	async autocomplete(interaction: AutocompleteInteraction) {
		const focusedOption = interaction.options.getFocused(true)
		console.log(focusedOption)
		switch (focusedOption.name) {
			case 'code': {

				break
			}
			default: {
				console.log("uh oh stinky")
				throw new Error("homosexual behaviour detected")
			}
		}


		const invites = await database.get(`.guilds.${interaction.guild.id}.invites`)

		//convert to array of objects (from object of objects)
		var invitesArray = Object.keys(invites).map(key => {
			return invites[key]
		})
		for (let i in invitesArray) {
			console.log("awaw")
			console.log(i)
			console.log(invitesArray[i])
		}
		let arrayWithNames = invitesArray.map(i => {
			let output = i.code
			if (i.name) {
				output += ` - ${i.name}`
			}
			return output
		})

		const matches = findBestMatch(focusedOption.value, arrayWithNames)
		console.log(matches)
		let filtered = []

		if (matches.bestMatch.rating === 0) {
			filtered = arrayWithNames.sort((a, b) => {
				return b.length - a.length
			})
			console.log(filtered)
		} else {
			let sorted = matches.ratings.sort((a, b) => {
				return b.rating - a.rating
			})
			console.log("sorted:")
			console.log(sorted)
			filtered = sorted.map(i => i.target)
		}

		var shortfiltered = filtered
		if (filtered.length > 10) {
			shortfiltered = filtered.slice(0, 5)
		}
		var response = shortfiltered.map(choice => {
			const name = choice
			console.log(name)
			const value = choice.split(' ')[0]

			return { name: name, value: value }
		})
		console.log(response)
		await interaction.respond(response)
	},
})

