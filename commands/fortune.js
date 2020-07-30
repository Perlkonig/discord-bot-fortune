module.exports = {
	name: 'fortune',
    description: 'Chooses a random fortune from any given categories',
    args: false,
    aliases: ['quote'],
	execute(message, args, globals) {
        let row;
        if (!args.length) {
            row = globals.db.prepare("SELECT quote FROM quotes ORDER BY RANDOM() LIMIT 1").get();
        } else {
            const cat = args[Math.floor(Math.random() * args.length)];
            row = globals.db.prepare("SELECT quote FROM quotes WHERE category=? ORDER BY RANDOM() LIMIT 1").get(cat);
        }
        message.channel.send("```" + row.quote + "```");
	},
};
