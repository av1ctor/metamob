export interface Lang {
    locale: string;
    title: string;
    flag: string;
}

export const languages: Lang[] = [
    {locale: 'en', flag: 'us', title: 'English'},
    {locale: 'pt-BR', flag: 'br', title: 'Português'},
];

export const loadMessages = async (locale: string) => {
    const res = await fetch(`/lang/${locale}.json`);
    if(!res.ok) {
        return {};
    }

    return await res.json();
};