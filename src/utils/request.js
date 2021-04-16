import axios from 'axios';
import {Message} from 'element-ui'

const service = axios.create({
    // process.env.NODE_ENV === 'development' 来判断是否开发环境
    // easy-mock服务挂了，暂时不使用了
    // baseURL: 'https://www.easy-mock.com/mock/592501a391470c0ac1fab128',
    timeout: 5000
});

service.interceptors.request.use(
    config => {
        return config;
    },
    err => {
        Message.error({message: '请求超时!'});
        return Promise.resolve(err);
    }
);

service.interceptors.response.use(
    response => {
        if (response.status === 200) {
            return response;
        } else {
            Message.error(response.data);
            return Promise.reject();
        }
    },
    error => {
        console.log(error);
        Message({
            message: error.response.data,
            type: 'error',
            duration: 5 * 1000
        })
        return Promise.reject(error)
    }
);

export default service;
