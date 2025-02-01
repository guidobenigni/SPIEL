document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('nav ul li a');
    const sections = document.querySelectorAll('main section');
    // Finnhub-Authentifizierung: Alle Requests werden mit dem Header "X-Finnhub-Secret" authentifiziert.
    // Dein gegebener Header-Wert: "cuf1sbpr01qno7m4nuv0"
    const FINNHUB_SECRET = 'cuf1sbpr01qno7m4nuv0';

    // Fehlerbereich dynamisch erstellen
    const errorMessageEl = document.createElement('div');
    errorMessageEl.id = 'error-message';
    errorMessageEl.style.display = 'none';
    errorMessageEl.style.color = 'red';
    errorMessageEl.style.marginTop = '20px';
    document.body.appendChild(errorMessageEl);

    // Standardmäßig die erste Sektion anzeigen
    if (sections.length > 0) sections[0].classList.remove('hidden');

    // Menü-Interaktion
    links.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            sections.forEach(section => section.classList.add('hidden'));
            document.getElementById(targetId).classList.remove('hidden');
            links.forEach(link => link.classList.remove('active'));
            this.classList.add('active');
            if (targetId === 'watchlist') loadWatchlist();
        });
    });

    // Vollständige Aktienliste (S&P 500, DAX, CAC 40, Dow Jones, ATX)
    async function loadWatchlist() {
        const stocks = [
            // S&P 500
            { symbol: 'AAPL', name: 'Apple' },
            { symbol: 'MSFT', name: 'Microsoft' },
            { symbol: 'AMZN', name: 'Amazon' },
            { symbol: 'GOOGL', name: 'Alphabet' },
            { symbol: 'TSLA', name: 'Tesla' },
            { symbol: 'NVDA', name: 'NVIDIA' },
            { symbol: 'META', name: 'Meta Platforms' },
            { symbol: 'BRK.B', name: 'Berkshire Hathaway' },
            { symbol: 'JNJ', name: 'Johnson & Johnson' },
            { symbol: 'V', name: 'Visa' },
            // DAX
            { symbol: 'SAP', name: 'SAP SE' },
            { symbol: 'BMW', name: 'BMW' },
            { symbol: 'VOW3', name: 'Volkswagen' },
            { symbol: 'DBK', name: 'Deutsche Bank' },
            { symbol: 'ALV', name: 'Allianz' },
            // CAC 40
            { symbol: 'AIR', name: 'Airbus' },
            { symbol: 'OR', name: "L'Oréal" },
            { symbol: 'MC', name: 'LVMH' },
            { symbol: 'SAN', name: 'Sanofi' },
            { symbol: 'BNP', name: 'BNP Paribas' },
            // Dow Jones
            { symbol: 'BA', name: 'Boeing' },
            { symbol: 'DIS', name: 'Disney' },
            { symbol: 'JPM', name: 'JPMorgan Chase' },
            { symbol: 'GS', name: 'Goldman Sachs' },
            { symbol: 'HD', name: 'Home Depot' },
            // ATX
            { symbol: 'EBS', name: 'Erste Group Bank' },
            { symbol: 'OMV', name: 'OMV AG' },
            { symbol: 'VER', name: 'Verbund' },
            { symbol: 'RBI', name: 'Raiffeisen Bank International' },
            { symbol: 'VOE', name: 'Voestalpine' }
        ];

        const watchlistBody = document.querySelector('#watchlist-table tbody');
        watchlistBody.innerHTML = ''; // Tabelle leeren
        hideError();

        for (const stock of stocks) {
            try {
                const rsi = await getRSI(stock.symbol);
                // Beispiel: Filtere RSI, der zwischen 25 und 35 liegt (anpassbar)
                if (rsi !== null && rsi >= 25 && rsi <= 35) {
                    addTableRow(watchlistBody, stock.symbol, stock.name, rsi.toFixed(2));
                } else {
                    addTableRow(watchlistBody, stock.symbol, stock.name, rsi !== null ? rsi.toFixed(2) : 'N/A');
                }
            } catch (error) {
                showError(`Fehler bei ${stock.symbol}: ${error.message}`);
                addTableRow(watchlistBody, stock.symbol, stock.name, 'Fehler');
            }
        }
    }

    // Holt den RSI-Wert via Finnhub API
    async function getRSI(symbol) {
        // Definiere den Zeitraum: z.B. die letzten 90 Tage
        const now = Math.floor(Date.now() / 1000);
        const from = now - (90 * 24 * 3600);
        // Baue die Finnhub-API-URL; beachte, dass der API-Key hier nicht als Query-Parameter, sondern über den Header gesendet wird.
        const url = `https://finnhub.io/api/v1/indicator?symbol=${symbol}&resolution=D&from=${from}&to=${now}&indicator=rsi&timeperiod=14`;
        const response = await fetch(url, {
            headers: {
                "X-Finnhub-Secret": FINNHUB_SECRET
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP-Fehler: ${response.status}`);
        }
        const data = await response.json();
        // Überprüfe, ob das Antwortobjekt ein Array mit RSI-Werten enthält (Feld "c")
        if (data && data.c && data.c.length > 0) {
            // Nehme den letzten Wert als aktuellen RSI
            return parseFloat(data.c[data.c.length - 1]);
        } else {
            throw new Error(`Keine RSI-Daten für ${symbol} erhalten.`);
        }
    }

    // Hilfsfunktion zum Hinzufügen einer Tabellenzeile
    function addTableRow(tbody, symbol, name, rsi) {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${symbol}</td><td>${name}</td><td>${rsi}</td>`;
        tbody.appendChild(row);
    }

    // Zeigt eine Fehlermeldung im Fehlerbereich an
    function showError(message) {
        console.error(message);
        errorMessageEl.style.display = 'block';
        errorMessageEl.textContent = message;
    }

    // Versteckt den Fehlerbereich
    function hideError() {
        errorMessageEl.style.display = 'none';
        errorMessageEl.textContent = '';
    }
});
