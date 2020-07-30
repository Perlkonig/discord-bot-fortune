module.exports = {
	name: 'fortunes',
    description: 'Lists the various fortune files available with statistics',
    args: false,
    aliases: ['quotes'],
	execute(message, args, globals) {
        const rows = globals.db.prepare("SELECT * FROM descriptions AS d LEFT JOIN (SELECT DISTINCT(category), COUNT(*) AS count FROM quotes GROUP BY category) AS q ON d.category = q.category ORDER BY d.category").all();
        const total = rows.reduce((result, item) => {return result + item.count}, 0);
        let msg = "There are " + total + " total quotes in the following files:\n```"
        rows.forEach(row => {
            msg += row.category + " (" + row.count + ")\n";
            if (row.description !== null) {
                msg += '    ' + row.description + "\n";
            }
        });
        msg += "```";
        message.channel.send(msg);
	},
};
