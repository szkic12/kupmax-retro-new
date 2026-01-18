# STRUKTURA FIRMY - KUPMAX

## KUPMAX PSA (Spółka)
- **Typ:** Prosta Spółka Akcyjna
- **Właściciel:** Mateusz Pietrow (Mati)
- **Koszt miesięczny:** ~42 zł (Biuro29)
- **CIT:** 9% od zysku (do 2 mln przychodu)

---

## MARKI POD KUPMAX PSA:

### 1. BossxD
- **Kategoria:** Materiały budowlane
- **Gdzie sprzedaje:** kupmax.pl (Shop.exe) - Retro Portal

### 2. Inception Honey
- **Kategoria:** Produkty naturalne (miód, pyłki, propolis, kąpiele)
- **Gdzie sprzedaje:** ai.kupmax.pl (główna platforma)

---

## JAK WYGLĄDA ETYKIETA PRODUKTU:

```
┌─────────────────────────────┐
│    INCEPTION HONEY          │  ← marka (duże)
│    Kąpiel Egipska           │  ← nazwa produktu
│                             │
│    Producent:               │
│    KUPMAX PSA               │  ← firma z KRS (małe)
│    ul. Wojska Polskiego 11  │
│    63-507 Kobyla Góra       │
│    NIP: 7393625722          │
└─────────────────────────────┘
```

---

## FLOW PRODUKTÓW:

### Shop.exe (kupmax.pl):
- Produkty gdzie `showInRetro = true`
- Głównie: BossxD (materiały budowlane)
- **Zasada dla NOWYCH firm:** Muszą dodać model 3D produktu żeby odblokować Shop.exe!

#### Jak to działa dla innych firm:
1. Firma zakłada konto na ai.kupmax.pl
2. Dodaje produkt z opisem, zdjęciami, ceną
3. **Checkbox "Show in Retro Portal" jest ZABLOKOWANY**
4. Firma musi wgrać model 3D produktu (GLB/GLTF)
5. Po dodaniu 3D → checkbox się ODBLOKOWUJE
6. Firma zaznacza "Show in Retro Portal"
7. Produkt pojawia się w Shop.exe na kupmax.pl

### ai.kupmax.pl:
- Wszystkie produkty z platformy
- Inception Honey + inne firmy
- System Galaktyki/Półek

### ai.kupmax.pl (przyszłość - Dzieci Offline):
- Produkty odblokowane przez zadania offline
- Skan liścia, zdjęcie ptaka, spacer = odblokowanie zakupu

---

## BAZA DANYCH:

```
Product:
├── isKupmaxProduct = true   → produkty KUPMAX PSA (Twoje)
├── showInRetro = true       → widoczne w Shop.exe (kupmax.pl)
└── sellerId                 → UUID firmy (null dla isKupmaxProduct)
```

---

*Zapisano: 18 stycznia 2026*
*Nie wkurwiamy się nawzajem - to jest źródło prawdy!*
