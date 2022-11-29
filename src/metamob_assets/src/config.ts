const isProduction = process.env.NODE_ENV === 'production';

export const config = {
    isProduction,
    IC_URL: isProduction?
        process.env.IC_URL:
        process.env.IC_URL_LOCAL,
    II_URL: isProduction?
        process.env.II_URL:
        process.env.II_URL_LOCAL,
    APP_URL: isProduction?
        process.env.APP_URL:
        process.env.APP_URL_LOCAL,
}