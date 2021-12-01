if(process.argv.length<5 || process.argv.length>7)
{
	console.log("Usage : index.js <host> <port> <name> [<password>]");
	process.exit(1);
}

const { channel } = require('diagnostics_channel');
const Discord = require('discord.js');
const mineflayer = require('mineflayer');
const basicUtils = require('basic-utils');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const GoalFollow = goals.GoalFollow
const GoalBlock = goals.GoalBlock
const toolPlugin = require('mineflayer-tool').plugin
const inventoryViewer = require('mineflayer-web-inventory')
const collectBlock = require('mineflayer-collectblock').plugin
const mineflayerViewer = require('prismarine-viewer').mineflayer
const autoeat = require("mineflayer-auto-eat");
const { callbackify } = require('util');
const client = new Discord.Client({
    intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES
    ]
});

let sending = false;
let chatData = [];

var options = ({
	username: process.argv[4],
	verbose: true,
	port:parseInt(process.argv[3]),
	host:process.argv[2],
	password:process.argv[5]
});

var bot = mineflayer.createBot(options);

bot.loadPlugin(pathfinder)
bot.loadPlugin(toolPlugin)
bot.loadPlugin(autoeat)
bot.loadPlugin(collectBlock)

client.on('ready', () => {
    console.log(`Connected to Discord!`)
    console.log(`Username: ${client.user.tag}`);
    
});


bot.on('login', async () => {
    console.log(`Bot is connected to Server!`)

bot.on("autoeat_started", () => {
  console.log("Auto Eat started!")
})

bot.on("autoeat_stopped", () => {
  console.log("Auto Eat stopped!")
})

bot.on("health", () => {
  if (bot.food === 20) bot.autoEat.disable()
  // Disable the plugin if the bot is at 20 food points
  else bot.autoEat.enable() // Else enable the plugin again
})


bot.on("message", message => {
    let channel = client.channels.cache.get('')
    if (!channel) return;
    if (sending == true) {
        chatData.push(`${message}`)
    }
    channel.send(`${message}`)
})

bot.on("death", message => {
    let channel = client.channels.cache.get('')
    if (!channel) return;
    channel.send(`I died x.x`)
})

client.on("message", async msg =>{
    let args = msg.content.split(" ").slice(1)

    if(msg.content.startsWith(".cmd")) {
        let toSend = args.join(" ");
        if (!toSend) return msg.reply("No Args")

        bot.chat(toSend)
        sending = true
        msg.channel.send(`${msg.author.tag} just send ${toSend}`)

        setTimeout(() => {
            sending = false
            msg.channel.send(chatData.join("\n"))
            chatData = []
        }, 750)

    }
})

client.on("message", async msg =>{const toolPlugin = require('mineflayer-tool').plugin
    if(msg.content.startsWith("come")) {
        msg.channel.send(`Comming to you in game!`)
        bot.chat("Sorry this is not a function yet!")
    }
})


client.on("message", async msg =>{
    if(msg.content.startsWith("leave")) {
        msg.channel.send(`leaving the game!`)
        bot.quit()
    }
})

client.on("message", async msg =>{
    let args = msg.content.split(" ").slice(1)
    if(msg.content.startsWith("follow")) {
        let target = args.join(" ");
        if (!target) return msg.reply("No Player mentioned!")
    
        let gotoplayer = bot.players[target]

        if (!gotoplayer || !gotoplayer.entity) {
            msg.channel.send(`I can't see ${target}`)
            return
        }

        const mcData = require('minecraft-data')(bot.version)
        const movements = new Movements(bot, mcData)
        

        movements.scafoldingBlocks = [ mcData.itemsByName.cobblestone.id, mcData.itemsByName.dirt.id, mcData.itemsByName.stone.id]
        movements.allowParkour = true;

        bot.pathfinder.setMovements(movements)
        msg.channel.send("Comming to you!")

        const goal = new GoalFollow(gotoplayer.entity, 2)
        bot.pathfinder.setGoal(goal, true)
    }
})

client.on("message", async msg =>{
    if(msg.content.startsWith("stop")) {
        msg.channel.send("Stopping..")
        bot.pathfinder.stop()
        bot.stopDigging()
    }
})

let block = []

client.once("message", async msg =>{
    const mcData = require('minecraft-data')(bot.version)
    let args = msg.content.split(" ").slice(1)
    if(msg.content.startsWith("mine")) {
        let target = args.join(" ");
        if (!target) return msg.reply("No Block mentioned!")

        const blockType = mcData.blocksByName[args[0]]
        if (!blockType) {
          bot.chat(`"I don't know any blocks named ${args[0]}.`)
          return
        }
      
        const block = bot.findBlock({
          matching: blockType.id,
          maxDistance: 64
        })
      
        if (!block) {
          bot.chat("I don't see that block nearby.")
          return
        }
      
        const targets = bot.collectBlock.findFromVein(block)
        bot.collectBlock.collect(targets)
    }
})


});
client.login('');
