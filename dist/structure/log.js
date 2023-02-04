"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const embeds = require('./embeds');
const database = require('./database');
exports.default = {
    async log(guild, message) {
        const channel = await database.get(`.guilds.${guild.id}.settings.log_channel`);
        console.log(channel);
        const c = await guild.channels.fetch(channel);
        //console.log(c)
        return c.send(message);
    },
    async channel(guild) {
        return await database.get(`.guilds.${guild.id}.settings.log_channel`);
    }
};
