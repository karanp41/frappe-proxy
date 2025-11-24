module.exports = {
    apps: [{
        name: 'frappe-proxy',
        script: 'server.js',
        instances: 1,
        exec_mode: 'fork',
        env: {
            NODE_ENV: 'production'
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 8081,
            FRAPPE_TARGET: 'https://sobha-bt-sandbox.xstack.ae'
        },
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_file: './logs/combined.log',
        time: true
    }]
};