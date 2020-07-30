const fs = require('fs');
const Discord = require('discord.js');
const config = require('./config.json');

// Initialize Discord Bot
var bot = new Discord.Client();
bot.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	bot.commands.set(command.name, command);
}

// Establish global vars
var db, checker;
const channel = "587473116767322139";
const globals = {channel: channel};
const cooldowns = new Discord.Collection();

bot.once('ready', function (evt) {
    console.log('Connected');
    console.log("Initializing database");
    db = require('better-sqlite3')('./db/fortunes.db', { });
    db.prepare("CREATE TABLE IF NOT EXISTS quotes (category TEXT NOT NULL, quote TEXT NOT NULL)").run();
    db.prepare("CREATE INDEX IF NOT EXISTS idx_cat ON quotes (category);").run();
    db.prepare("CREATE TABLE IF NOT EXISTS descriptions (category TEXT NOT NULL PRIMARY KEY, description TEXT)").run();
    db.prepare("CREATE INDEX IF NOT EXISTS idx_catdesc ON descriptions (category);").run();
    globals.db = db;
});

bot.on('message', message => {
	if (!message.content.startsWith(config.prefix) || message.author.bot) return;

	const args = message.content.slice(config.prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

    const command = bot.commands.get(commandName)
        || bot.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if (!command) return;    

    if (command.args && !args.length) {
        return message.channel.send(`You didn't provide any arguments, ${message.author}!`);
    }

    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }
    
    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;
    
    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
    
        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${command.name}\` command.`);
        }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);        

    try {
        command.execute(message, args, globals);
    } catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
    }
})

process.on( "SIGINT", function() {
    console.log( "\ngracefully shutting down from SIGINT (Crtl-C)" );
    process.exit();
} );
  
process.on( "exit", function() {
    console.log("Closing db");
    db.close();
    console.log("Done. Goodbye.");
} );

bot.login(config.token);
