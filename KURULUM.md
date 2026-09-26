# Kurulum

Bu rehber, broid-bank'ı bir Qbox sunucusuna kurmayı adım adım anlatır.

## 1. Gereksinimler

Sunucunuzda şu resource'lar kurulu ve çalışır durumda olmalı:

| Resource | Ne için |
| --- | --- |
| [qbx_core](https://github.com/Qbox-project/qbx_core) | Oyuncu, nakit ve banka parası |
| [ox_lib](https://github.com/overextended/ox_lib) | Tuş ataması, ekran ipucu, bildirim, çeviri |
| [oxmysql](https://github.com/overextended/oxmysql) | İşlem geçmişinin veritabanında tutulması |

Qbox kullanıyorsanız bu üçü zaten kuruludur.

## 2. Dosyaları yerleştirin

1. Bu klasörü sunucunuzun `resources` klasörüne kopyalayın.
2. Klasör adını `broid-bank` yapın (önerilir).
3. İçinde `web/build` klasörünün bulunduğundan emin olun. Arayüz bu klasörden yüklenir; yoksa arayüz açılmaz (bkz. [Sorun giderme](#6-sorun-giderme)).

Doğru yapı şöyle görünür:

```
resources/
└── broid-bank/
    ├── fxmanifest.lua
    ├── config.lua
    ├── client/
    ├── server/
    ├── locales/
    ├── sql/
    └── web/
        └── build/
```

## 3. server.cfg

`server.cfg` dosyanıza şu satırları ekleyin. `ensure broid-bank` satırı **ox_lib, oxmysql ve qbx_core'dan sonra** gelmelidir; en güvenlisi dosyanın sonuna eklemektir.

```cfg
# Arayüz ve bildirimlerin Türkçe olması için
setr ox:locale "tr"

ensure broid-bank
```

`ox:locale` satırı sunucunuzda zaten varsa tekrar eklemeyin, değerinin `"tr"` olduğunu kontrol edin.

## 4. Veritabanı

Elle bir şey yapmanıza gerek yok. Resource ilk açıldığında `broid_bank_transactions` tablosunu kendisi oluşturur.

Tabloyu elle kurmak isterseniz `sql/install.sql` dosyasını HeidiSQL, phpMyAdmin vb. ile sunucunuzun veritabanında çalıştırın.

## 5. Oyunda deneme

Sunucuyu başlatın (ya da konsolda `ensure broid-bank` yazın) ve şunları sırayla deneyin:

- [ ] Haritada banka işaretleri görünüyor.
- [ ] Legion Square'deki Fleeca bankasına gidip tezgaha yaklaşınca **[E] Bankaya eriş** ipucu çıkıyor.
- [ ] `E` ile arayüz açılıyor; bakiye ve nakit doğru görünüyor.
- [ ] Para yatırma ve çekme çalışıyor, nakit/banka değerleri değişiyor.
- [ ] Başka bir oyuncunun sunucu ID'sine transfer gidiyor ve karşı taraf bildirim alıyor.
- [ ] **Geçmiş** sekmesinde yapılan işlemler listeleniyor.
- [ ] Bir ATM'ye yaklaşınca **[E] ATM kullan** ipucu çıkıyor; ATM'de sadece yatırma/çekme var.
- [ ] `ESC` ya da sağ üstteki çarpı ile arayüz kapanıyor.

## 6. Sorun giderme

**Arayüz açılmıyor ya da boş ekran geliyor**
`web/build` klasörü eksik olabilir. Klasörü yeniden kopyalayın ya da arayüzü kendiniz derleyin (bkz. [Arayüzü yeniden derleme](#8-arayüzü-yeniden-derleme)).

**Bankada "[E] Bankaya eriş" ipucu çıkmıyor**
- Araçtayken ipucu çıkmaz, araçtan inin.
- Tezgaha 2 metreden fazla uzak olabilirsiniz. Ya yaklaşın ya da `config.lua` içindeki `Config.InteractDistance` değerini artırın.
- Bankanın koordinatı tezgaha tam oturmuyor olabilir. `Config.Banks` listesinden o bankanın `coords` değerini düzeltin. Doğru koordinatı almak için tezgahın önünde durup bir koordinat scripti (ör. `/coords`) kullanabilirsiniz.

**Metinler İngilizce görünüyor**
`server.cfg` dosyasında `setr ox:locale "tr"` satırı eksik ya da farklı bir dil yazılı. Düzeltip sunucuyu yeniden başlatın.

**"Bankadan çok uzaktasınız" hatası**
Arayüz açıkken oyuncu, açtığı noktadan `Config.MaxSessionDistance` (5 m) kadar uzaklaşmış. Arayüzü kapatıp yeniden açın.

**Konsolda tablo ya da MySQL hatası**
oxmysql'in veritabanına bağlanabildiğini kontrol edin (`server.cfg` içindeki `mysql_connection_string`). Sorun sürerse `sql/install.sql` dosyasını elle çalıştırın.

**Maaş ve cezalar geçmişte görünmüyor**
- `config.lua` içinde `Config.LogExternal = true` olduğunu kontrol edin.
- Bu özellik, qbx_core'un para değiştiğinde yaydığı `QBCore:Server:OnMoneyChange` olayına bağlıdır. Çok eski ya da değiştirilmiş bir qbx_core sürümünde bu olay olmayabilir.

**Etkileşim tuşunu değiştirdim ama oyunda hâlâ E**
Tuş FiveM'in tuş ayarlarına kaydedilir. `Config.InteractKey` yalnızca oyuncunun ilk girişindeki varsayılanı belirler. Oyuncular tuşu **Ayarlar → Tuş Atamaları → FiveM → Banka / ATM etkileşimi** bölümünden değiştirebilir.

## 7. Ayarlar

Tüm ayarlar `config.lua` dosyasındadır; çoğunun üstünde açıklaması yazar. En sık değiştirilenler:

| Ayar | Varsayılan | Açıklama |
| --- | --- | --- |
| `Config.BrandName` | `'Broid'` | Kartın sol üstünde görünen isim |
| `Config.CurrencySymbol` | `'$'` | Para birimi simgesi |
| `Config.MaxAmount` | `10000000` | Tek işlemde izin verilen en yüksek tutar |
| `Config.Atm.maxWithdraw` | `5000` | ATM'den tek seferde çekilebilecek en yüksek tutar |
| `Config.Atm.enabled` | `true` | `false` yapılırsa ATM'ler kapanır |
| `Config.HistoryLimit` | `50` | Geçmiş sekmesinde gösterilen işlem sayısı |
| `Config.PruneDays` | `30` | Bu kadar günden eski kayıtlar silinir (`0` = hiç silme) |
| `Config.Blip.enabled` | `true` | Haritadaki banka işaretleri |

Ayar değiştirdikten sonra konsolda `ensure broid-bank` yazmanız yeterlidir.

Arayüzdeki ve bildirimlerdeki metinleri değiştirmek için `locales/tr.json` dosyasını düzenleyin.

## 8. Arayüzü yeniden derleme

Sadece arayüzün kodunu (`web/src`) değiştirdiyseniz gerekir. Renkler de buna dahildir. Ayarlar ve çeviriler için gerekmez.

Bilgisayarınızda [Node.js](https://nodejs.org) 20 veya üstü kurulu olmalı:

```bash
cd web
npm install
npm run build
```

Bu komutlar `web/build` klasörünü yeniden üretir. Ardından sunucuda `ensure broid-bank` yazın.

Oyuna girmeden tarayıcıda denemek için `npm run dev` çalıştırıp `http://localhost:5173` adresini açın (ATM görünümü için `http://localhost:5173/?mode=atm`). Bu modda sahte veri kullanılır.
