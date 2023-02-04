// const { SlashCommandBuilder, SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js')
// const embeds = require('../../structure/embeds')
// const format = require('../../structure/format')
// const database = require('../../structure/database')
// const calc = require('../../structure/calc')
// const invites = require('../../structure/invites')



// export default {
// 	data: new SlashCommandBuilder()
// 		.setName('invite')
// 		.setDescription('Manage invites')
// 		.addSubcommand((command: any) => command
// 			.setName('list')
// 			.setDescription('list invites')
// 		)
// 		.addSubcommand((command: any) => command
// 			.setName('name')
// 			.setDescription('Assign a name to an invite')
// 			.addStringOption((option: any) => option
// 				.setName('code')
// 				.setDescription('The invite to edit')
// 				.setRequired(true)
// 				.setAutocomplete(true)
// 			)
// 			.addStringOption((option: any) => option
// 				.setName('name')
// 				.setDescription('the name to assign')
// 			)
// 		)
// 		.addSubcommand((command: any) => command
// 			.setName('create')
// 			.setDescription('create a new invite.')
// 			.addStringOption((option: any) => option
// 				.setName('name')
// 				.setDescription('name of the invite')
// 			)
// 			.addChannelOption((option: any) => option
// 				.setName('channel')
// 				.setDescription('the channel to invite to')
// 			)
// 			.addIntegerOption((option: any) => option
// 				.setName('length')
// 				.setDescription('How long the invite should last. Defaults to forever')
// 				.addChoices(
// 					{ name: '30 minutes', value: 60 * 30 },
// 					{ name: '1 hour', value: 60 * 60 },
// 					{ name: '6 hours', value: 60 * 60 * 6 },
// 					{ name: '12 hours', value: 60 * 60 * 12 },
// 					{ name: '1 day', value: 60 * 60 * 24 },
// 					{ name: '7 days', value: 60 * 60 * 24 * 7 },
// 					{ name: 'Forever', value: 0 },
// 				)
// 			)
// 			.addIntegerOption((option: any) => option
// 				.setName('maxuses')
// 				.setDescription('Maximum number of uses. Defaults to infinite'))
// 		),
// 	async execute(interaction: any) {
// 		switch (interaction.options.getSubcommand()) {
// 			case 'list': {
// 				await interaction.reply({ ephemeral: true, embeds: embeds.messageEmbed("listing invites...") })
// 				const invitelist = await database.get(`.guilds.${interaction.guild.id}.invites`)
// 				console.log(invitelist)
// 				var output = ""

// 				for (let i in invitelist) {
// 					console.log(i)
// 					const invite = invitelist[i]
// 					const code = i
// 					const name = invite.name ? `${invite.name} - ` : ""
// 					const hasExpired = invite.expired
// 					const uses = invite.uses
// 					console.log(code, name, hasExpired, uses)
// 					console.log(invite.inviterId)
// 					const inviter = await interaction.client.users.fetch(invite.inviterId)
// 					var tempoutput = ``


// 					tempoutput += `${name}\`${code}\`, by ${await inviter.tag},`

// 					if (!hasExpired) {
// 						let guildinvite = await interaction.guild.invites.fetch(code)
// 						const createdTimestamp = `<t:${guildinvite.createdTimestamp.toString().slice(0, -3)}>`
// 						let expiresTimestamp = ``
// 						if (guildinvite._expiresTimestamp) {
// 							expiresTimestamp = `<t:${await guildinvite._expiresTimestamp.toString().slice(0, -3)}>`
// 						} else {
// 							expiresTimestamp = `never`
// 						}
// 						tempoutput += `at ${createdTimestamp}, till ${expiresTimestamp}, to <#${guildinvite.channelId}>,`
// 					}

// 					tempoutput += `uses: ${uses}`
// 					if (!hasExpired) {
// 						let guildinvite = await interaction.guild.invites.fetch(code)
// 						console.log(guildinvite)
// 						var maxUses = guildinvite.maxUses
// 						if (maxUses === 0) maxUses = `∞`
// 						tempoutput += `/${maxUses}`
// 					}

// 					output += `\n${tempoutput}`
// 				}

// 				//output += `\nInvites marked as [-] have expired.`
// 				const messages = format.splitMessage(output, 1900, "\n")
// 				for (let i = 0, len = messages.length; i < len; i++) {
// 					interaction.followUp({ ephemeral: true, content: messages[i] })
// 				}

// 				break
// 			}
// 			case 'name': {
// 				const guild = interaction.guild
// 				const code = interaction.options.getString('code')
// 				const name = interaction.options.getString('name')

// 				if (!await database.get(`.guilds.${guild.id}.invites.${code}`)) {
// 					interaction.reply({ ephemeral: true, embeds: embeds.warningEmbed(`Invalid Invite`) })
// 					return
// 				}
// 				database.set(`.guilds.${guild.id}.invites.${code}.name`, name)
// 				interaction.reply({ ephemeral: true, embeds: embeds.successEmbed(`Invite Renamed`, `Invite \`${code}\` renamed to \`${name}\``) })

// 				break
// 			}
// 			case 'create': {
// 				const name = interaction.options.getString('name')
// 				const channel = interaction.options.getChannel('channel') || await interaction.guild.channels.fetch(interaction.guild.systemChannelId)
// 				const length = interaction.options.getInteger('length') || 0
// 				const maxuses = interaction.options.getInteger('maxuses') || 0
// 				channel.createInvite({ unique: true, maxAge: length, maxUses: maxuses, reason: "invite create command" })
// 					.then(async (invite: any) => {
// 						console.log(`Created an invite with a code of ${invite.code}`)
// 						console.log(invite)
// 						if (name) {
// 							// the database entry will be created because the event inviteCreate is emitted
// 							await database.set(`.guilds.${interaction.guild.id}.invites.${invite.code}.name`, name)
// 							await interaction.reply({ ephemeral: true, embeds: embeds.successEmbed(`Created Invite`, `Created Invite with name \`${name}\`, to channel ${channel}.`) })
// 						} else {
// 							await interaction.reply({ ephemeral: true, embeds: embeds.successEmbed(`Created Invite`, `Created Invite to channel ${channel}.`) })
// 						}
// 						await interaction.followUp({ ephemeral: true, content: `https://discord.gg/${invite.code}` })
// 					})
// 				break
// 			}
// 			default: {
// 				break
// 			}
// 		}
// 	},
// 	async autocomplete(interaction: any) {
// 		const focusedOption = interaction.options.getFocused(true)
// 		console.log(focusedOption)
// 		switch (focusedOption.name) {
// 			case 'code': {

// 				break
// 			}
// 			default: {
// 				console.log("uh oh stinky")
// 				throw new Error("homosexual behaviour detected")
// 			}
// 		}


// 		const invites = await database.get(`.guilds.${interaction.guild.id}.invites`)

// 		// //convert to array of objects (from object of objects)
// 		// var choices = Object.keys(invites).map(key => {
// 		// 	return data[key]
// 		// })
// 		var choices

// 		const filtered = choices.filter(choice => choice.code.startsWith(focusedOption.value))

// 		var shortfiltered = filtered
// 		if (filtered.length > 25) {
// 			shortfiltered = filtered.slice(0, 24)
// 		}
// 		var response = shortfiltered.map((choice:any) => {
// 			console.log(choice)
// 			var name = `${choice.code}`
// 			if (choice.name) {
// 				name += ` - ${choice.name}`
// 			}
// 			//name += ` - by ${(interaction.client.users.fetch(choice.inviterId)).username}`

// 			console.log(choice.code)
// 			console.log({ name: name, value: choice.code })
// 			return { name: name, value: choice.code }
// 		})
// 		console.log(response)
// 		await interaction.respond(response)
// 	}
// }