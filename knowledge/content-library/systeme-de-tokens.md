# Pourquoi et comment créer un système de tokens applicable à vos produits digitaux
Article rédigé par Arthur Mathon (LinkedIn). Tags : DesignSystem, Product.

## Introduction

Dans les années 1990, le principal défi du design web était de créer des pages web de moins de 40 Ko, car les connexions Internet étaient lentes. Les sites web étaient créés en utilisant HTML, CSS et PHP. Cependant, le paysage du design web a radicalement changé avec l'arrivée de Flash en 2000. Flash a apporté l'animation, des capacités de conception, des capacités de script pour interagir avec les backends, et même la diffusion de contenu en continu pour compenser les connexions Internet lentes. Vers la fin des années 2000, l'ère des appareils mobiles a radicalement transformé Internet et notre vie quotidienne. Soudain, tout devait s'adapter à différentes tailles d'écran. La technologie a continué à évoluer rapidement, rendant tout plus complexe. Aujourd'hui, environ 20 ans plus tard, les designers s'efforcent toujours de concevoir des interfaces au pixel près, tandis que les développeurs prônent la faisabilité, la performance, un code stable et propre. Enfin, nous pouvons rêver aujourd'hui que ces deux mondes se rapprochent, grâce aux Tokens ! Aujourd’hui, chez Jems, nous profitons de cette opportunité pour vous offrir une offre d’accompagnement dans la création de vos produits pour aller un cran plus loin dans l’industrialisation des processus de conception et de maintenance des produits digitaux.

## Qu’est-ce qu’un token ?

Les composants d'une page web sont constitués d'éléments plus petits appelés tokens. Ils encodent les décisions de design les plus fines prises lors de la phase de conception. Ils fonctionnent de manière similaire aux variables, permettant la création de systèmes qui s'adaptent à plusieurs marques et thèmes, tels que le mode sombre et le mode clair. Vous pouvez les considérer comme l’ADN ou le squelette de votre produit.

## Token Studio : un outil d’industrialisation

Cette entreprise participe activement à la communauté (DTCG) pour créer des normes pour le format et l'encodage des tokens, les rendant utilisables dans n'importe quel environnement de travail. Au fil du temps, l’outil a étendu son support pour inclure la gestion des tailles, espacements, dimensions, couleurs, rayons, largeurs de bordure, typographies, opacités, élévations, et bien plus encore. Il propose désormais des fonctionnalités de gestion des modes et du multi-marque, les modificateurs de couleur, et un encodage LCH. Studio se synchronise également directement avec GitHub, Azure DevOps, GitLab, Supernova, et permet ainsi de créer des scripts d’automatisations qui font rêver tout contributeur au DesignOps.

## L’importance des tokens dans le design web moderne

Ils sont devenus un élément essentiel du design web moderne. Ils permettent aux concepteurs de créer des systèmes de conception flexibles, adaptables et cohérents, tout en facilitant la collaboration entre les équipes de conception et de développement.

## 1. Consistance visuelle

L'une des principales préoccupations des designers est de maintenir une cohérence visuelle sur l'ensemble d'un site web ou d'une application. Les tokens permettent de définir des styles de manière centralisée, garantissant que les couleurs, les typographies, les espacements et d'autres éléments visuels restent cohérents à travers toutes les pages et tous les écrans. Cela crée une expérience utilisateur à la fois fluide et cohérente. 2. Adaptabilité multi-marque et multi-thème

Avec l'expansion des marques et des thèmes dans le monde numérique, il est essentiel de pouvoir adapter le design en fonction des besoins spécifiques de chaque marque ou thème. Les tokens permettent aux designers de créer toutes les variables et règles nécessaires pour adapter votre produit en fonction de votre besoin.

## 3. Facilité de maintenance

Les tokens facilitent la maintenance des design systems. Lorsqu'il est nécessaire de les mettre à jour, il suffit de modifier la valeur pour qu’elle se propage automatiquement à tous les éléments qui l’utilisent. Cela évite les changements fastidieux et manuels à travers l'ensemble du projet.

## 4. Collaboration harmonieuse

Comme les tokens sont utilisables autant par les développeurs que les designers, ils favorisent une collaboration harmonieuse entre eux. Vous pouvez ainsi les rassembler dans un répertoire (par exemple GIT) pour synchroniser le développement avec la conception. Vous réduisez alors les malentendus et les erreurs de communication, qui se traduira par une mise en œuvre plus rapide et plus précise du design.

## Comment créer un système de tokens étape par étape ?

Maintenant que nous avons exploré leur importance dans le design web moderne, voyons comment créer un système étape par étape.

## 1. Rassemblez et faites l’inventaire de vos composants

La première étape consiste à rassembler tous les composants de votre système de design. L'objectif est de créer un inventaire complet de tous les composants que vous utiliserez dans votre projet. Lors de cette étape, vous pouvez également regrouper des ensembles de composants par famille. Par exemple, regroupez tous les boutons, les en-têtes, les formulaires, etc. Cette hiérarchisation

vous permettra de mieux organiser vos tokens et de simplifier la gestion globale du design. L'idée est de réduire leur nombre au minimum nécessaire pour maintenir la flexibilité sans ajouter de complexité inutile.

## 2. Définissez vos dimensions.

Une fois que vous avez rassemblé vos composants, vous pouvez passer à la définition des tokens de dimension. Ces derniers sont essentiels pour définir des valeurs de base telles que les tailles de police, les marges, les espacements, les largeurs, etc.

Compilez l’ensemble dans un fichier texte ou une feuille de calcul. Pour chaque token, spécifiez les valeurs minimales et maximales possibles. Cela vous permet de définir des limites pour les valeurs que vous utiliserez dans votre design. Il est également important d'identifier la granularité et le rythme de vos valeurs. Par exemple, vous pourriez décider que toutes les tailles de police seront des multiples de 4 pour maintenir la cohérence. Cette approche permet de simplifier la gestion et d'assurer une meilleure utilisabilité du système que vous souhaitez mettre en place.

## 3. Listez, rédigez et documentez

Cette étape consiste à étudier vos composants en détail. Analysez leur structure, leur hiérarchie, leurs relations les uns avec les autres, etc. Cette étape vous permettra de comprendre les différents aspects de votre système de design. Je vous conseille le style et le papier, ou du moins de procéder à une phase rédactionnelle qui est adaptée à l’exploration. Ensuite, définissez chaque famille en fonction de vos observations. Par exemple, vous pourriez créer une famille pour les couleurs, une pour les typographies, une pour les espacements, etc. L'idée est de regrouper des tokens similaires pour une gestion plus efficace. N'oubliez pas de les documenter de manière détaillée. Incluez des descriptions, des exemples d'utilisation et des règles pour guider les utilisateurs (qu’ils soient designer ou développeur). Une documentation solide garantit l’utilisabilité de votre futur système ET sa maintenance dans le temps. Lors de cette étape, gardez à l'esprit les mots d'Antoine de Saint-Exupéry : "La perfection est atteinte non pas lorsqu'il n'y a plus rien à ajouter, mais lorsqu'il n'y a plus rien à retirer." Un système efficace est à la fois concis et précis.

4. Créez vos tokens Une fois que vous avez une vision claire de vos tokens et de leur utilisation, vous pouvez passer à leur création suivant trois grandes catégories : -Les "Core Tokens" englobent toutes les options possibles pour concevoir votre produit. Imaginez-les comme une boîte à outils contenant toutes les tailles, couleurs, espacements, etc., nécessaires pour créer votre design. -Les "Option Tokens" rassemblent toutes les décisions de design qui définissent vos thèmes et les règles régissant l'apparence de tous vos CTA (Call to Action). -Enfin, les "Component Tokens" sont spécifiquement appliqués aux composants, tels que des boutons, des cartes, des modales, etc. Ils façonnent leur apparence et leur comportement.

## Conclusion

Les tokens ont radicalement transformé le design web moderne. Ils sont devenus des éléments essentiels pour garantir la cohérence visuelle, l'adaptabilité et la facilité de maintenance des design systems. Ils simplifient la collaboration entre les concepteurs et les développeurs, réduisent la complexité des projets de design, et permettent de répondre aux demandes changeantes de l'industrie. Créer un système étape par étape demande du temps et de l'effort, mais les avantages qu'ils apportent en valent la peine. Ils vous permettent de créer des designs de haute qualité, de réduire les erreurs, de gagner du temps et de simplifier la gestion de projets complexes. Les tokens sont la clé pour s'adapter au rythme rapide de l'évolution du design web et offrir une expérience utilisateur exceptionnelle. Vous êtes convaincu mais souhaitez une offre de conseil et de service pour y arriver ? Bouton
