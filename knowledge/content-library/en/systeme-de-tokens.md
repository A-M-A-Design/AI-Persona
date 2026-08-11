# Why and how to build a token system for your digital products
Article written by Arthur Mathon (LinkedIn). Tags: DesignSystem, Product.

## Introduction

In the 1990s, the main challenge in web design was building web pages under 40 KB, because internet connections were slow. Websites were built with HTML, CSS and PHP. The landscape changed radically with the arrival of Flash in 2000. Flash brought animation, design capabilities, scripting to interact with backends, and even content streaming to compensate for slow connections. Towards the end of the 2000s, the mobile era transformed the internet and our daily lives. Suddenly everything had to adapt to different screen sizes. Technology kept evolving quickly, making everything more complex. Today, some twenty years later, designers still strive to design pixel-perfect interfaces while developers advocate for feasibility, performance, and stable, clean code. At last we can dream of these two worlds moving closer together — thanks to tokens.

## What is a token?

The components of a web page are made up of smaller elements called tokens. They encode the finest design decisions taken during the design phase. They work much like variables, making it possible to build systems that adapt to several brands and themes, such as dark mode and light mode. Think of them as the DNA, or the skeleton, of your product.

## Token Studio: a tool for industrialisation

This company takes an active part in the community (DTCG) to create standards for the format and encoding of tokens, making them usable in any working environment. Over time the tool has extended its support to cover sizes, spacing, dimensions, colours, radii, border widths, typography, opacity, elevation and much more. It now offers mode and multi-brand management, colour modifiers and LCH encoding. Studio also syncs directly with GitHub, Azure DevOps, GitLab and Supernova, making it possible to write the kind of automation scripts any DesignOps contributor dreams of.

## Why tokens matter in modern web design

Tokens have become an essential part of modern web design. They let designers build flexible, adaptable and consistent design systems, while making collaboration between design and development teams easier.

## 1. Visual consistency

One of the main concerns for designers is maintaining visual consistency across an entire website or application. Tokens let you define styles centrally, guaranteeing that colours, typography, spacing and other visual elements stay consistent across every page and every screen. The result is a user experience that is both smooth and coherent.

## 2. Multi-brand and multi-theme adaptability

As brands and themes proliferate in the digital world, being able to adapt a design to the specific needs of each brand or theme is essential. Tokens let designers create all the variables and rules needed to adapt your product to your requirements.

## 3. Ease of maintenance

Tokens make design systems easier to maintain. When they need updating, changing a single value is enough for it to propagate automatically to every element that uses it. This avoids tedious manual changes across the whole project.

## 4. Smooth collaboration

Because tokens are usable by developers and designers alike, they encourage smooth collaboration between the two. You can gather them in a repository (Git, for instance) to keep development in sync with design. That reduces misunderstandings and miscommunication, which in turn means the design is implemented faster and more accurately.

## How do you build a token system, step by step?

Now that we have explored why tokens matter in modern web design, let us look at how to build a system step by step.

## 1. Gather and inventory your components

The first step is to gather every component in your design system. The goal is to build a complete inventory of all the components you will use in your project. At this stage you can also group sets of components into families — all the buttons together, all the headers, all the forms, and so on. This hierarchy will help you organise your tokens better and simplify managing the design as a whole. The idea is to reduce their number to the minimum necessary, keeping flexibility without adding needless complexity.

## 2. Define your dimensions

Once you have gathered your components, you can move on to defining your dimension tokens. These are essential for setting base values such as font sizes, margins, spacing, widths and so on.

Compile the whole set in a text file or a spreadsheet. For each token, specify the minimum and maximum possible values. This lets you set boundaries for the values you will use in your design. It is also important to identify the granularity and rhythm of your values. For example, you might decide that all font sizes will be multiples of four, to maintain consistency. This approach simplifies management and makes the system you are putting in place more usable.

## 3. List, write and document

This step involves studying your components in detail. Analyse their structure, their hierarchy, how they relate to one another. It will help you understand the different aspects of your design system. My advice is to use pen and paper, or at least to go through a writing phase suited to exploration. Then define each family based on your observations. You might create one family for colours, one for typography, one for spacing, and so on. The idea is to group similar tokens together for more efficient management. Do not forget to document them thoroughly. Include descriptions, usage examples and rules to guide users, whether they are designers or developers. Solid documentation guarantees that your future system will be usable AND maintainable over time. At this stage, keep Antoine de Saint-Exupéry's words in mind: "Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away." An effective system is both concise and precise.

## 4. Create your tokens

Once you have a clear view of your tokens and how they will be used, you can move on to creating them, following three broad categories:

- "Core Tokens" cover every possible option for designing your product. Think of them as a toolbox holding all the sizes, colours, spacing and so on needed to build your design.
- "Option Tokens" gather all the design decisions that define your themes and the rules governing the appearance of every CTA (Call to Action).
- "Component Tokens" apply specifically to components such as buttons, cards and modals. They shape their appearance and behaviour.

## Conclusion

Tokens have radically transformed modern web design. They have become essential to guaranteeing visual consistency, adaptability and ease of maintenance in design systems. They simplify collaboration between designers and developers, reduce the complexity of design projects, and make it possible to meet the industry's shifting demands. Building a system step by step takes time and effort, but the benefits are worth it. Tokens let you produce high-quality designs, reduce errors, save time and simplify the management of complex projects. They are the key to keeping pace with the fast evolution of web design and delivering an outstanding user experience.
