let livres = []; 
let pageCourante = 1;
const maxParPage = 8; 

const booksGrid = document.getElementById('books-grid');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const paginationContainer = document.getElementById('pagination');

const bookModal = document.getElementById('book-modal');
const bookForm = document.getElementById('book-form');
const btnOuvrirModal = document.getElementById('btn-ouvrir-modal');
const btnFermerModal = document.getElementById('btn-fermer-modal');

document.addEventListener('DOMContentLoaded', () => {
    chargerFichierXML();
    configurerEcouteurs(); 
});

function chargerFichierXML() {
    fetch('assets/data/book.xml')
        .then(response => {
            if (!response.ok) throw new Error("Fichier XML introuvable");
            return response.text();
        })
        .then(xmlTexte => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlTexte, "text/xml");
            extraireLivresDuXML(xmlDoc);
        })
        .catch(err => {
            console.error("Erreur de chargement du XML :", err);
            initAppVide(); 
        });
}

function extraireLivresDuXML(xmlDoc) {
    const balises = xmlDoc.getElementsByTagName('book');
    
    for (let i = 0; i < balises.length; i++) {
        livres.push({
            id: 'id-' + Date.now() + '-' + i, // ID unique pour le CRUD
            titre: balises[i].getElementsByTagName('title')[0]?.textContent || 'Sans titre',
            auteur: balises[i].getElementsByTagName('author')[0]?.textContent || 'Inconnu',
            categorie: balises[i].getElementsByTagName('category')[0]?.textContent || 'Général',
            annee: balises[i].getElementsByTagName('year')[0]?.textContent || 'N/A', // Extraction de l'année
            prix: balises[i].getElementsByTagName('price')[0]?.textContent || '0', // Extraction du prix
            image: balises[i].getElementsByTagName('image')[0]?.textContent || 'couverture.jpg'
        });
    }
    
    genererCategoriesDansLeMenu();
    mettreAJourInterface();
}

function initAppVide() {
    genererCategoriesDansLeMenu();
    mettreAJourInterface();
}

function genererCategoriesDansLeMenu() {
    const categoriesUniques = [...new Set(livres.map(livre => livre.categorie))];
    
    categoryFilter.innerHTML = '<option value="tous">Toutes les catégories</option>';
    categoriesUniques.forEach(cat => {
        categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

// Filtres, Pagination, Affichage
function mettreAJourInterface() {
    const livresFiltrés = filtrerLesLivres();
    const livresDeLaPage = decouperParPage(livresFiltrés, pageCourante);
    
    dessinerLaGrille(livresDeLaPage);
    dessinerLaPagination(livresFiltrés.length);
}

function filtrerLesLivres() {
    const recherche = searchInput.value.toLowerCase().trim();
    const categorie = categoryFilter.value;

    return livres.filter(livre => {
        const correspondTexte = livre.titre.toLowerCase().includes(recherche) || 
                                livre.auteur.toLowerCase().includes(recherche);
        const correspondCategorie = (categorie === 'tous') || (livre.categorie === categorie);
        
        return correspondTexte && correspondCategorie;
    });
}

function decouperParPage(liste, page) {
    const debut = (page - 1) * maxParPage;
    return liste.slice(debut, debut + maxParPage);
}

function dessinerLaGrille(livresAAfficher) {
    booksGrid.innerHTML = ""; 

    if (livresAAfficher.length === 0) {
        booksGrid.innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>Aucun livre trouvé.</p>";
        return;
    }

    livresAAfficher.forEach(livre => {
        let sourceImage = `assets/images/${livre.image}`;

        booksGrid.innerHTML += `
            <div class="book-card">
                <img src="${sourceImage}" 
                     alt="${livre.titre}" 
                     style="width: 100%; height: 280px; object-fit: cover; display: block;"
                     onerror="this.src='assets/images/couverture.jpg'">
                <div class="book-info">
                    <h3>${livre.titre}</h3>
                    <p><strong>Auteur :</strong> ${livre.auteur}</p>
                    <p><strong>Année :</strong> ${livre.annee}</p>
                    <p><strong>Prix :</strong> ${livre.prix} FCFA</p>
                    <p><strong>Catégorie :</strong> <span class="tag">${livre.categorie}</span></p>
                </div>
                <div class="book-actions">
                    <button class="btn-modifier" onclick="ouvrirModalModification('${livre.id}')">Modifier</button>
                    <button class="btn-supprimer" onclick="supprimerUnLivre('${livre.id}')">Supprimer</button>
                </div>
            </div>
        `;
    });
}

function dessinerLaPagination(totalLivres) {
    paginationContainer.innerHTML = "";
    const totalPages = Math.ceil(totalLivres / maxParPage);

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.style.backgroundColor = (i === pageCourante) ? "#111" : "#fff";
        btn.style.color = (i === pageCourante) ? "#fff" : "#111";
        btn.style.margin = "0 5px";
        btn.style.padding = "6px 12px";
        btn.style.border = "1px solid #e0e0e0";
        btn.style.borderRadius = "4px";
        btn.style.cursor = "pointer";
        
        btn.addEventListener('click', () => {
            pageCourante = i;
            mettreAJourInterface();
        });
        
        paginationContainer.appendChild(btn);
    }
}

// 
// LES OPÉRATIONS DU CRUD (Create, Update, Delete)
// 
function ouvrirModalAjout() {
    document.getElementById('modal-title').textContent = "Ajouter un livre";
    bookForm.reset();
    document.getElementById('book-id').value = ""; 
    bookModal.classList.remove('hidden');
}

window.ouvrirModalModification = function(id) {
    const livre = livres.find(l => l.id === id);
    if (!livre) return;

    document.getElementById('modal-title').textContent = "Modifier le livre";
    document.getElementById('book-id').value = livre.id;
    document.getElementById('form-title').value = livre.titre;
    document.getElementById('form-author').value = livre.auteur;
    document.getElementById('form-category').value = livre.categorie;
    document.getElementById('form-image').value = livre.image; 
    
    
    if(document.getElementById('form-year')) document.getElementById('form-year').value = livre.annee;
    if(document.getElementById('form-price')) document.getElementById('form-price').value = livre.prix;

    bookModal.classList.remove('hidden');
}

function sauvegarderLivre(event) {
    event.preventDefault(); 

    const idActuel = document.getElementById('book-id').value;
    const donnees = {
        titre: document.getElementById('form-title').value.trim(),
        auteur: document.getElementById('form-author').value.trim(),
        categorie: document.getElementById('form-category').value.trim(),
        image: document.getElementById('form-image').value.trim() || 'couverture.jpg',
        annee: document.getElementById('form-year')?.value.trim() || new Date().getFullYear().toString(),
        prix: document.getElementById('form-price')?.value.trim() || '0'
    };

    if (idActuel) {
        // MODE MODIFICATION (Update)
        const index = livres.findIndex(l => l.id === idActuel);
        if (index !== -1) {
            livres[index] = { id: idActuel, ...donnees };
            alert(`Le livre "${donnees.titre}" a été modifié avec succès !`);
        }
    } else {
        // MODE AJOUT (Create)
        const nouvelId = 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        livres.push({ id: nouvelId, ...donnees });
        alert(`Le livre "${donnees.titre}" a été ajouté avec succès ! 🎉`);
    }

    bookModal.classList.add('hidden');
    genererCategoriesDansLeMenu(); 
    mettreAJourInterface();
}

window.supprimerUnLivre = function(id) {
    if (confirm("Voulez-vous vraiment supprimer ce livre ?")) {
        livres = livres.filter(l => l.id !== id);
        genererCategoriesDansLeMenu();
        mettreAJourInterface();
    }
}

function configurerEcouteurs() {
    searchInput.addEventListener('input', () => { pageCourante = 1; mettreAJourInterface(); });
    categoryFilter.addEventListener('change', () => { pageCourante = 1; mettreAJourInterface(); });
    btnOuvrirModal.addEventListener('click', ouvrirModalAjout);
    btnFermerModal.addEventListener('click', () => bookModal.classList.add('hidden'));
    bookForm.addEventListener('submit', sauvegarderLivre);
}