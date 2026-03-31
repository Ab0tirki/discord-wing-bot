const http = require('http');

// ================= [ قسم السيرفر الوهمي لـ Render ] =================
// هذا الجزء يمنع خطأ Timed Out في منصة Render
http.createServer((req, res) => {
    res.write("I'm alive");
    res.end();
}).listen(8080);
// =================================================================

const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');
const cron = require('node-cron');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent 
    ]
});

// ================= [ قسم الإعدادات ] =================
const CONFIG = {
    // هنا نقول للبوت: اقرأ التوكن من "خزنة" Render السرية
    TOKEN: process.env.DISCORD_TOKEN, 
    AUTHORIZED_ROLES: [
        '1479979457484816646', 
        '1479979458860552332', 
        '1479979460655714334'
    ]
};

// بيانات الونقات والرتب
const wingsData = [
    { id: 'speed', name: 'Speed Unit', days: ['Thursday', 'Sunday'], channelId: '1479979607582052467', roleId1: '1479979497628631110', roleId2: '1479979470814314698' },
    { id: 'air', name: 'Air Ship', days: ['Wednesday', 'Monday'], channelId: '1479979611894059068', roleId1: '1479979498240737576', roleId2: '1479979472295035033' },
    { id: 'moto', name: 'Motorcycle', days: ['Sunday', 'Tuesday'], channelId: '1479979616184569909', roleId1: '1479979499172007988', roleId2: '1479979473389752330' },
    { id: 'neg', name: 'Negotiator', days: ['Wednesday', 'Monday'], channelId: '1479979600808382625', roleId1: '1479979500447072288', roleId2: '1479979468654116864' },
    { id: 'disp', name: 'Dispatch', days: ['Tuesday', 'Thursday'], channelId: '1479979592386216131', roleId1: '1479979502435045580', roleId2: '1479979466406105343' }
];
// =====================================================

client.once('ready', () => {
    console.log(`✅ تم تشغيل البوت بنجاح باسم: ${client.user.tag}`);
});

// أضف هذا الجزء تحت عشان نصيد الأخطاء المخفية
client.on('error', (error) => {
    console.error('❌ حدث خطأ في البوت:', error);
});

process.on('unhandledRejection', error => {
    console.error('❌ خطأ غير متوقع:', error);
});

// أمر إنشاء لوحة التحكم (!setup)
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

// معالجة ضغط الأزرار
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

// دالة الإرسال (منشن الرتبتين)
function sendReminder(wing, type) {
    const channel = client.channels.cache.get(wing.channelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setTitle(`📢 تنبيه: ${wing.name}`)
        .setDescription(`نحيطكم علماً باقتراب موعد افتتاح الونق المخصص لكم`)
        .addFields({ name: 'BY:', value: type })
        .setTimestamp()
        .setColor('#2b2d31');

    channel.send({ 
        content: `<@&${wing.roleId1}> <@&${wing.roleId2}>`, 
        embeds: [embed] 
    });
}

client.login(CONFIG.TOKEN);