document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('nav ul li a');
    const sections = document.querySelectorAll('main section');

    // Standardmäßig die erste Sektion anzeigen
    sections[0].classList.remove('hidden');

    links.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const targetId = this.getAttribute('href').substring(1);

            // Alle Sektionen ausblenden
            sections.forEach(section => {
                section.classList.add('hidden');
            });

            // Die gewählte Sektion anzeigen
            document.getElementById(targetId).classList.remove('hidden');

            // Alle Links deaktivieren
            links.forEach(link => link.classList.remove('active'));

            // Den aktiven Link hervorheben
            this.classList.add('active');
        });
    });
});
