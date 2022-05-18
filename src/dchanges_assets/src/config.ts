export const config = {
    II_URL: process.env.NODE_ENV === 'production'?
        process.env.II_URL:
        process.env.II_URL_LOCAL,
    BASE_URL: process.env.NODE_ENV === 'production'?
        process.env.BASE_URL:
        process.env.BASE_URL_LOCAL,
}