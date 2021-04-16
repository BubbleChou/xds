import request from '../utils/request';

export const postRequest = (url, params) => {
    return request({
        method: 'post',
        url: 'http://localhost:8080/' + url,
        data: params
    });
};
