# Konfiguracja CORS dla S3 Bucket

## Problem
Upload plików kończy się błędem:
```
CORS Missing Allow Origin
Kod stanu: 403
```

## Rozwiązanie
Musisz dodać konfigurację CORS do swojego S3 bucket `kupmax-downloads`.

## Instrukcja krok po kroku:

1. **Otwórz AWS Console**: https://console.aws.amazon.com/s3/
2. **Znajdź bucket**: `kupmax-downloads`
3. **Przejdź do zakładki**: "Permissions" (Uprawnienia)
4. **Przewiń w dół do sekcji**: "Cross-origin resource sharing (CORS)"
5. **Kliknij**: "Edit" (Edytuj)
6. **Wklej poniższą konfigurację JSON**:

```json
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedOrigins": [
      "https://www.kupmax.pl",
      "https://kupmax.pl",
      "http://localhost:3000"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-server-side-encryption",
      "x-amz-request-id",
      "x-amz-id-2"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

7. **Kliknij**: "Save changes" (Zapisz zmiany)

## Co robi ta konfiguracja?

- **AllowedOrigins**: Zezwala na requesty z www.kupmax.pl, kupmax.pl i localhost
- **AllowedMethods**: Zezwala na GET (pobieranie), PUT (upload), POST, DELETE, HEAD
- **AllowedHeaders**: Zezwala na wszystkie headers (potrzebne dla presigned URLs)
- **ExposeHeaders**: Udostępnia headers S3 do przeglądarki (dla progress tracking)
- **MaxAgeSeconds**: Cache preflight requests przez 1 godzinę

## Weryfikacja

Po zastosowaniu konfiguracji:
1. Poczekaj 1-2 minuty na propagację zmian
2. Odśwież stronę www.kupmax.pl/downloads
3. Spróbuj uploadować plik
4. Błędy CORS powinny zniknąć ✅

## Alternatywna metoda (AWS CLI)

Jeśli wolisz użyć CLI:

```bash
# Zapisz konfigurację do pliku cors.json
cat > cors.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": [
        "https://www.kupmax.pl",
        "https://kupmax.pl",
        "http://localhost:3000"
      ],
      "ExposeHeaders": [
        "ETag",
        "x-amz-server-side-encryption",
        "x-amz-request-id",
        "x-amz-id-2"
      ],
      "MaxAgeSeconds": 3600
    }
  ]
}
EOF

# Zastosuj konfigurację
aws s3api put-bucket-cors \
  --bucket kupmax-downloads \
  --cors-configuration file://cors.json

# Zweryfikuj
aws s3api get-bucket-cors --bucket kupmax-downloads
```

## Bezpieczeństwo

Ta konfiguracja CORS:
- ✅ Jest bezpieczna - zezwala tylko na kupmax.pl
- ✅ Używa HTTPS (bezpieczne połączenie)
- ✅ Nie zezwala na uploady z innych domen
- ✅ Headers są standardowe dla S3 presigned URLs

## Dodatkowe uwagi

Jeśli chcesz **bardziej restrykcyjną** konfigurację, możesz:
1. Usunąć `http://localhost:3000` (tylko dla produkcji)
2. Ograniczyć AllowedHeaders do konkretnych (np. tylko `Content-Type`)
3. Zmniejszyć MaxAgeSeconds

Jeśli chcesz **mniej restrykcyjną** (nie zalecane):
```json
"AllowedOrigins": ["*"]  // Zezwala na wszystkie domeny
```
