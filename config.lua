Config = {}

-- Arayüzün üst kısmında görünen isim
Config.BrandName = 'Broid'
Config.CurrencySymbol = '$'

-- Etkileşim tuşu (oyuncular FiveM ayarlarından değiştirebilir)
Config.InteractKey = 'E'

-- Bankaya/ATM'ye bu mesafeden etkileşim kurulabilir
Config.InteractDistance = 2.0

-- Arayüz açıkken oyuncu açtığı noktadan bu kadar uzaklaşırsa işlemler reddedilir
Config.MaxSessionDistance = 5.0

-- İki işlem arasında beklenecek süre (ms)
Config.Cooldown = 750

-- Tek bir işlemde izin verilen en yüksek tutar
Config.MaxAmount = 10000000

-- Transfer açıklamasının en fazla karakter sayısı
Config.NoteMaxLength = 60

-- Arayüzde gösterilecek işlem sayısı
Config.HistoryLimit = 50

-- Bu kadar günden eski işlem kayıtları sunucu açılışında silinir (0 = kapalı)
Config.PruneDays = 30

-- Maaş, ceza, kartla ödeme gibi başka scriptlerden gelen banka hareketlerini de kaydet
Config.LogExternal = true

Config.Blip = {
    enabled = true,
    sprite = 108,
    color = 27,
    scale = 0.7,
}

Config.Banks = {
    { label = 'Fleeca · Legion Square', coords = vec3(150.27, -1040.20, 29.37) },
    { label = 'Fleeca · Hawick', coords = vec3(314.19, -278.62, 54.17) },
    { label = 'Fleeca · Burton', coords = vec3(-351.53, -49.53, 49.04) },
    { label = 'Fleeca · Rockford Hills', coords = vec3(-1212.98, -330.84, 37.79) },
    { label = 'Fleeca · Great Ocean Hwy', coords = vec3(-2962.58, 482.63, 15.70) },
    { label = 'Fleeca · Route 68', coords = vec3(1175.06, 2706.64, 38.09) },
    { label = 'Pacific Standard', coords = vec3(241.73, 220.71, 106.29) },
    { label = 'Blaine County Savings', coords = vec3(-112.20, 6469.30, 31.63) },
}

Config.Atm = {
    enabled = true,
    -- ATM'den tek seferde çekilebilecek en yüksek tutar
    maxWithdraw = 5000,
    models = {
        `prop_atm_01`,
        `prop_atm_02`,
        `prop_atm_03`,
        `prop_fleeca_atm`,
    },
}
