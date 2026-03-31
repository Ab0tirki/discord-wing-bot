const http = require('http');
const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');
const cron = require('node-cron');

// ================= [ فحص النظام للسيرفر ] =================
console.log("--- فحص النظام ---");
console.log("هل التوكن موجود في الخزنة؟", process.env.DISCORD_TOKEN ? "نعم ✅" : "لا ❌");
console.log("-----------------");

http.createServer((req, res) => {
    res.write("I'm alive");
    res.end();
}).listen(8080);

// ================= [ إعدادات البوت ] =================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent 
    ]
});

const CONFIG = {
    TOKEN: process.env.DISCORD_TOKEN,
    AUTHORIZED_ROLES: [
        '1372708813341200404', 
        '1372708945797320804', 
        '1434635780969598976'
    ]
};

// بيانات الونقات
const wingsData = [
    { id: 'speed', name: 'Speed Unit', days: ['Thursday', 'Sunday'], channelId: '1483935515123388469', roleId1: '1400929548669030400', roleId2: '1411762707912196239' },
    { id: 'air', name: 'Air Ship', days: ['Wednesday', 'Monday'], channelId: '1483935350064681091', roleId1: '1403313311306743918', roleId2: '1400929583397867554' },
    { id: 'moto', name: 'Motorcycle', days: ['Sunday', 'Tuesday'], channelId: '1483935861396602990', roleId1: '1400929578494726328', roleId2: '1411304837899092020' },
    { id: 'neg', name: 'Negotiator', days: ['Wednesday', 'Monday'], channelId: '1483936081627058247', roleId1: '1400929569510391959', roleId2: '1411762575397486803' },
    { id: 'disp', name: 'Dispatch', days: ['Tuesday', 'Thursday'], channelId: '1483935680886341732', roleId1: '1400929573969072178', roleId2: '1411762478978961518' }
];

client.once('ready', () => {
    console.log(`✅ تم تشغيل البوت بنجاح باسم: ${client.user.tag}`);
});

// ================= [ نظام التنبيه التلقائي ] =================
// يرسل كل يوم الساعة 17:00 (5 المغرب) بتوقيت الرياض
cron.schedule('0 17 * * *', () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayIndex = new Date().getDay();
    const tomorrowName = days[(todayIndex + 1) % 7];

    wingsData.forEach(wing => {
        if (wing.days.includes(tomorrowName)) {
            sendReminder(wing, "تذكير تلقائي (قبل موعد الونق بـ 24 ساعة)");
            console.log(`[LOG] تم إرسال تذكير تلقائي لـ ${wing.name}`);
        }
    });
}, {
    timezone: "Asia/Riyadh"
});

// ================= [ الأوامر والتعامل مع الأزرار ] =================

client.on('messageCreate', async (message) => {
    if (message.content === '!setup') {
        const hasRole = message.member.roles.cache.some(role => CONFIG.AUTHORIZED_ROLES.includes(role.id));
        if (!hasRole && !message.member.permissions.has('Administrator')) return;

        const row = new ActionRowBuilder().addComponents(
            wingsData.map(wing => 
                new ButtonBuilder()
                    .setCustomId(`remind_${wing.id}`)
                    .setLabel(wing.name)
                    .setStyle(ButtonStyle.Primary)
            )
        );

        const embed = new EmbedBuilder()
            .setTitle('RT | Wing Presidency')
            .setDescription('استخدم الأزرار أدناه لإرسال تنبيه يدوي للمسؤولين عن الونق.')
            .setColor('#1a1a1a');

        message.channel.send({ embeds: [embed], components: [row] });
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    const hasRole = interaction.member.roles.cache.some(role => CONFIG.AUTHORIZED_ROLES.includes(role.id));
    if (!hasRole) return interaction.reply({ content: "❌ لا تملك صلاحية.", ephemeral: true });

    const wingId = interaction.customId.replace('remind_', '');
    const wing = wingsData.find(w => w.id === wingId);

    if (wing) {
        sendReminder(wing, `تذكير يدوي: ${interaction.user.username}`);
        await interaction.reply({ content: `✅ تم إرسال التنبيه ${wing.name}`, ephemeral: true });
    }
});

function sendReminder(wing, type) {
    const channel = client.channels.cache.get(wing.channelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setTitle(`📢 تنبيه: ${wing.name}`)
        .setDescription(`نحيطكم علماً باقتراب موعد افتتاح الونق المخصص لكم غداً.`)
        .addFields({ name: 'نوع التنبيه:', value: type })
        .setTimestamp()
        .setColor('#2b2d31');

    channel.send({ 
        content: `<@&${wing.roleId1}> <@&${wing.roleId2}>`, 
        embeds: [embed] 
    });
}

client.login(CONFIG.TOKEN);
