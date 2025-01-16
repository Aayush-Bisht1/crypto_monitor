import {createClient} from 'redis';

class Redis {
    static async getInstance() {
        if (!this.client) {
            this.client = createClient();
            this.client.on('error', err => console.error('Redis Error:', err));
            await this.client.connect();
        }
        return this.client;
    }
}

export default Redis;