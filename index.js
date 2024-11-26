import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import { Client, GatewayIntentBits } from 'discord.js';

// Create a new client with appropriate intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // For reading message content
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
    ],
});

// Log in to the bot using the token from .env
client.login(process.env.DISCORD_TOKEN);

// Log a message when the bot is ready
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Respond to incoming messages
client.on("messageCreate", async (message) => {
    // Ignore messages from bots
    if (message.author.bot) return;

    // Check if the message starts with '!crypto'
    if (message.content.startsWith('!crypto')) {
        // Inform the user that the bot is fetching data
        await message.channel.send('Fetching cryptocurrency data...');

        try {
            // Fetch data from CoinMarketCap API
            const response = await axios.get(
                'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',
                {
                    headers: {
                        'X-CMC_PRO_API_KEY': process.env.CMC_TOKEN,
                    },
                }
            );

            // Extract and format top cryptocurrencies
            const topCryptos = response.data.data.slice(0, 5) // Example: top 5 cryptocurrencies
                .map((coin) => `${coin.name} (${coin.symbol}): $${coin.quote.USD.price.toFixed(2)}`)
                .join('\n');

            // Send the data back to the Discord channel
            await message.channel.send(`Top Cryptocurrencies:\n${topCryptos}`);
        } catch (error) {
            console.error(error);
            // Send an error message
            await message.channel.send('Failed to fetch cryptocurrency data. Please try again later.');
        }
    }

});
