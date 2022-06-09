const isProduction = process.env.NODE_ENV === 'production';

export const config = {
    II_URL: isProduction?
        process.env.II_URL:
        process.env.II_URL_LOCAL,
    APP_URL: isProduction?
        process.env.APP_URL:
        process.env.APP_URL_LOCAL,
}