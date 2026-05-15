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

  const inputPath = path.join(TEMP_DIR, `input_${uniqueId}.lua`);
  const outputPath = path.join(OUTPUT_DIR, `obfuscated_${uniqueId}.lua`);

  try {
    await msg.reply('🔒 Obfuscando archivo...');

    const response = await axios.get(attachment.url, {
      responseType: 'arraybuffer'
    });

    fs.writeFileSync(inputPath, response.data);

    // CORREGIDO: Usar rutas absolutas y mejor manejo
    const luaPath = '/usr/bin/lua5.4';
    const cliPath = '/app/Prometheus/cli.lua';
    
    const commandLine = `${luaPath} "${cliPath}" "${inputPath}" -o "${outputPath}"`;

    console.log('Ejecutando:', commandLine);

    exec(commandLine, { shell: '/bin/bash', maxBuffer: 1024 * 1024 * 10 }, async (error, stdout, stderr) => {
      
      console.log('STDOUT:', stdout);
      console.log('STDERR:', stderr);

      if (error) {
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        
        return msg.reply('❌ Error al obfuscar el archivo. Asegúrate que el archivo Lua sea válido.');
      }

      if (!fs.existsSync(outputPath)) {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        return msg.reply('❌ Prometheus no generó el archivo de salida.');
      }

      const obfuscatedFile = new AttachmentBuilder(outputPath);

      await msg.reply({
        content: '✅ Archivo obfuscado correctamente:',
        files: [obfuscatedFile]
      });

      // Limpiar archivos temporales
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    });

  } catch (err) {
    console.error('Error:', err);
    
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    
    msg.reply('❌ Ocurrió un error al procesar el archivo.');
  }
});

client.login(process.env.TOKEN);