export type UserSettings = {
    userId: string;
    userLangs: string[];
};

export type SettingsResponse = UserSettings | { data: UserSettings };