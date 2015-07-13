!function (fs) {
    'use strict';

    fs.readFile(process.argv[2], function (err, text) {
        if (err) { return process.exit(-1); }

        var transporter = require('nodemailer').createTransport({
                service: 'Gmail',
                auth: {
                    user: 'compulim.robot@gmail.com',
                    pass: 'password'
                }
            }),
            mail = {
                from: 'Sync TV <compulim.robot@gmail.com>',
                to: 'William Wong <compulim@hotmail.com>',
                subject: 'Report of Sync TV',
                text: text
            }

        transporter.sendMail(mail);
    });
}(
    require('fs')
);