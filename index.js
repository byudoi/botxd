const {
  Client,
  GatewayIntentBits,
  AttachmentBuilder
} = require('discord.js');

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const PREFIX = ',';

const TEMP_DIR = './temp';
const OUTPUT_DIR = './output';

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

client.once('ready', () => {
  console.log(`Bot conectado como ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {

  if (msg.author.bot) return;
  if (!msg.content.startsWith(PREFIX)) return;

  const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  if (command !== 'obf') return;

  const attachment = msg.attachments.first();

  if (!attachment) {
    return msg.reply('Sube un archivo `.lua` o `.txt`.');
  }

  const allowedExtensions = ['.lua', '.txt'];
  const extension = path.extname(attachment.name).toLowerCase();

  if (!allowedExtensions.includes(extension)) {
    return msg.reply('Solo archivos `.lua` o `.txt`.');
  }

  const uniqueId = Date.now();

  const inputPath = path.join(
    TEMP_DIR,
    `input_${uniqueId}.lua`
  );

  const outputPath = path.join(
    OUTPUT_DIR,
    `obfuscated_${uniqueId}.lua`
  );

  try {

    await msg.reply('Obfuscando archivo...');

    const response = await axios.get(attachment.url, {
      responseType: 'arraybuffer'
    });

    fs.writeFileSync(inputPath, response.data);

    const commandLine =
      lua5.4 Prometheus/cli.lua "${inputPath}" -o "${outputPath}"`;

    exec(commandLine, async (error, stdout, stderr) => {

      if (error) {
        console.log(stderr);

        if (fs.existsSync(inputPath)) {
          fs.unlinkSync(inputPath);
        }

        return msg.reply('Error al obfuscar el archivo.');
      }

      if (!fs.existsSync(outputPath)) {

        if (fs.existsSync(inputPath)) {
          fs.unlinkSync(inputPath);
        }

        return msg.reply('Prometheus no generó salida.');
      }

      const obfuscatedFile =
        new AttachmentBuilder(outputPath);

      await msg.reply({
        content: 'Archivo obfuscado:',
        files: [obfuscatedFile]
      });

      if (fs.existsSync(inputPath)) {
        fs.unlinkSync(inputPath);
      }

      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }

    });

  } catch (err) {

    console.log(err);

    if (fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }

    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    msg.reply('Ocurrió un error.');
  }

});

client.login(process.env.TOKEN);
