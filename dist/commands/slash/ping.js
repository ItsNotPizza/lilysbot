"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { SlashCommandBuilder } = require('discord.js');
exports.default = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction) {
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
        interaction.editReply(`Pong!\nRoundtrip latency: ${sent.createdTimestamp - interaction.createdTimestamp}ms`);
        console.log(JSON.stringify(interaction.client));
    },
};
