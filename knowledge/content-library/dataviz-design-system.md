# Le design système au service de vos besoins en data visualisation

Article rédigé par Arthur Mathon (LinkedIn, 24 janvier 2023). Tags : DesignOps, Dashboard, Dataviz, DesignSystem.

Chez Jems, grâce à notre expertise en conception de systèmes de composants, nous pouvons aujourd’hui soutenir notre offre dans le domaine de l’exploitation de la donnée.

En effet, pour bien concevoir vos produits qui nécessitent l’intégration d’une plateforme de data visualisation, nous exploitons les design systèmes en complément de l’offre Dixit pour répondre aux contraintes de fiabilité et d’agilité inhérentes à vos besoins. Nous tenterons ici de vous en expliquer les raisons.

## Le design système garantit la conception de tableaux de bord adaptés au contexte réel des données client et de ses utilisateurs finaux

De nombreux outils de data visualisation existent mais peu permettent de rendre compte à l’étape du prototypage de l’utilisation réelle de vos données. Ce découplage entraîne souvent un fossé entre l’UX, l’UI, l’intégration et le produit final.

Un design système répond à ce problème en intégrant une librairie de graphiques à la fois responsive et adaptée à toutes les typologies d’exploitation de vos données. Grâce à elle, vous n’aurez plus de surprise lors de la mise en production de votre solution de dashboarding et vous pourrez simplifier le workflow de l’équipe design associé au projet.

Cette librairie doit contenir des composants dynamiques qui, raccordés à une base de données réelle, rendront visible de manière fidèle vos données. De cette manière vous pourrez identifier, dès l'étape de conception, tous les problèmes qui d'habitude le sont qu'une fois le développement commencé. Vous gagnerez alors un temps précieux en phase de conception tout en diminuant la friction lors du hand-off Design/Developpement/Intégration.

Le système doit également fonctionner en version dark et light mode. Si parfois ces déclinaisons sont négligées, elles deviennent indispensables pour les interfaces de visualisation de données. La quantité d'information pouvant être très dense, il est prépondérant que le contexte d'utilisation (environnement très lumineux ou très sombre) ne viennent pas affecter la lecture des graphiques. En effet, un environnement très lumineux aura tendance à diminuer les contrastes des couleurs alors qu'un environnement sombre va favoriser la fatigue des yeux.

## Les guidelines comme aide à la conception

Quel graphique choisir pour répondre à tel besoin en utilisant telle base de données ? Voici LA question qui va driver la conception de chaque fonctionnalité de votre dashboard. Grâce aux guidelines d’un design système vous serez en mesure de vous détacher de cette problématique pour vous concentrer uniquement à l'élaboration d'un parcours client optimal et à la mise en œuvre de vos solutions.

> Graphical excellence is that which gives to the viewer the greatest number of ideas in the shortest time with the least ink in the smallest space. — Edward R. Tufte, *The Visual Display of Quantitative Information*

En effet, un histogramme se prête mieux à la comparaison de deux à quatre types de données sur une même plage temporelle tandis qu'une courbe est adaptée à une lecture fine. Un Camembert est idéal pour visualiser un dataset de petite taille contrairement aux courbes qui peuvent prendre en charge des bases données très importantes. Les graphiques par empilement d'aires est idéal pour visualiser des relations partielles entre plusieurs jeux de données, mais ne se prête pas aux données parcellaires. Le design système est là pour référencer ces pratiques de conception et guider les designers dans la construction des tableaux de visualisation.

Les guidelines peuvent également comprendre un ensemble de best-practices de conceptions, intelligibles autant par le client, le PO, les designers et intégrateurs. Elles rassurent le client quant aux choix ergonomiques. Elles offrent aux concepteurs une base de confiance sur laquelle ils peuvent se reposer pour guider la création du service. Enfin, elles posent un cadre d'évolution du service, pour garantir la qualité lors des différentes releases. Ces guidelines peuvent se matérialiser comme suit :

- **Utilisez les camemberts avec précaution** : nous avons des difficultés à discerner une quantité à partir d'une part de gâteau.
- **Mettez en valeur vos textes** : quand vous le pouvez, basculez le texte de vos histogrammes à 90 degrés pour qu'ils deviennent lisibles sans avoir à se tordre le cou.
- **Faites attention à l'accumulation visuelle** : il est parfois plus facile de comparer quatre données dans quatre graphiques différents plutôt que les combiner en un.
- **Gardez le strict nécessaire** : supprimez les éléments graphiques inutiles ou distrayants, pour réduire la charge mentale. Les lignes de grille trop sombres, les éléments 3D, labels ou textes sont autant d'informations qui doivent se justifier d'un point de vue utilisateur.

> Products fulfilling a purpose are like tools. They are neither decorative objects nor works of art. Their design should therefore be both neutral and restrained, to leave room for the user's self-expression. — Dieter Rams, *Principles of Design*

## Les styleguides comme garants de la qualité

Il existe de nombreux types de déficiences visuelles qui affectent la capacité des personnes à différencier les couleurs. Tout le monde a du mal à différencier des couleurs voisines sur la roue chromatique. Comme abordé en première partie de cet article, ces problématiques sont exacerbées sur des mauvais écrans ou dans des environnements visuellement contraignants. Le styleguide d'un design système existe pour répondre à ces problématiques.

En effet, un système de couleur documenté garanti à la fois un niveau d'accessibilité de l'information conforme aux exigences WCAG et une utilisation respectueuse de votre identité graphique. Vous éviterez alors l'écueil des tableaux de bords qui ressemblent aux décorations de Noël quand la fête bat son plein. Il est d'ailleurs conseillé de minimiser l'usage de la couleur et de la supprimer lors de la contextualisation ou la comparaison. Une palette riche de gris couplée à l'utilisation de différents niveaux de graisse permet d'améliorer l'impact de vos couleurs lorsque vous déciderez de les appliquer.

L'utilisation d'un système typographique solide facilitera quant à lui la hiérarchisation de l'information et diminuera dans le même temps l'effort mental nécessaire à vos utilisateurs pour la lire. Il garantira l'accessibilité sur tous type de support.

> Allowing artist-illustrators to control the design and content of statistical graphics is almost like allowing typographers to control the content, style, and editing of prose. — Edward R. Tufte, *The Visual Display of Quantitative Information*

Google et la London City Intelligence ont déjà intégré ces informations clefs au guide de style de leur design système afin d’industrialiser leurs procédés et garantir la qualité de leurs produits, alors pourquoi pas vous ?
