# Design systems in the service of your data visualization needs

Article written by Arthur Mathon (LinkedIn, 24 January 2023). Tags: DesignOps, Dashboard, Dataviz, DesignSystem.

At Jems, our expertise in designing component systems now allows us to support our offering in the field of data exploitation.

To design products that require integrating a data visualization platform properly, we use design systems alongside the Dixit offering, in order to meet the reliability and agility constraints inherent to your needs. Here we will try to explain why.

## A design system guarantees dashboards designed around the real context of the client's data and its end users

Many data visualization tools exist, but few make it possible to account for the real use of your data at the prototyping stage. That decoupling often creates a gap between UX, UI, implementation and the final product.

A design system answers this problem by including a chart library that is both responsive and suited to every way your data may be exploited. With it, you will no longer face surprises when your dashboarding solution goes into production, and you can simplify the workflow of the design team on the project.

That library must contain dynamic components which, connected to a real database, render your data faithfully. This way you can identify, as early as the design stage, every problem that would usually surface only once development has started. You save precious time during design while reducing friction at the design/development/implementation hand-off.

The system must also work in dark and light mode. These variants are sometimes neglected, yet they are indispensable for data visualization interfaces. Because the volume of information can be very dense, it is critical that the context of use — a very bright or very dark environment — does not affect how charts are read. A very bright environment tends to reduce colour contrast, while a dark one encourages eye fatigue.

## Guidelines as an aid to design

Which chart should I choose to meet this need, using this database? That is THE question that will drive the design of every feature in your dashboard. Thanks to the guidelines of a design system, you can set that problem aside and focus solely on crafting an optimal customer journey and implementing your solutions.

> Graphical excellence is that which gives to the viewer the greatest number of ideas in the shortest time with the least ink in the smallest space. — Edward R. Tufte, *The Visual Display of Quantitative Information*

A bar chart lends itself better to comparing two to four types of data over the same time range, whereas a line chart suits fine-grained reading. A pie chart is ideal for visualising a small dataset, unlike line charts which can handle very large databases. Stacked area charts are ideal for showing partial relationships between several datasets, but do not suit fragmentary data. The design system is there to catalogue these design practices and guide designers in building visualisation dashboards.

Guidelines can also include a set of design best practices, intelligible to the client, the PO, the designers and the developers alike. They reassure the client about ergonomic choices. They give designers a foundation of confidence to guide the creation of the service. Finally, they set a framework for the service to evolve, guaranteeing quality across releases. These guidelines can take a form such as:

- **Use pie charts with caution**: we struggle to judge a quantity from a slice of cake.
- **Give your text its due**: whenever you can, rotate the text of your bar charts by 90 degrees so it becomes readable without craning your neck.
- **Watch out for visual accumulation**: it is sometimes easier to compare four data points across four separate charts than to combine them into one.
- **Keep only what is necessary**: remove useless or distracting graphical elements to reduce cognitive load. Grid lines that are too dark, 3D effects, labels and text are all pieces of information that must justify themselves from the user's point of view.

> Products fulfilling a purpose are like tools. They are neither decorative objects nor works of art. Their design should therefore be both neutral and restrained, to leave room for the user's self-expression. — Dieter Rams, *Principles of Design*

## Style guides as guarantors of quality

There are many kinds of visual impairment that affect people's ability to tell colours apart. Everyone struggles to distinguish neighbouring colours on the colour wheel. As covered in the first part of this article, these problems are amplified on poor screens or in visually demanding environments. The style guide of a design system exists to answer them.

A documented colour system guarantees both a level of information accessibility compliant with WCAG requirements and a respectful use of your visual identity. You will avoid the pitfall of dashboards that look like Christmas decorations at the height of the party. It is in fact advisable to minimise the use of colour, and to drop it when providing context or comparison. A rich palette of greys, combined with varying font weights, increases the impact of your colours when you do decide to apply them.

A solid typographic system, for its part, makes it easier to establish hierarchy in the information while reducing the mental effort your users need to read it. It guarantees accessibility on every kind of device.

> Allowing artist-illustrators to control the design and content of statistical graphics is almost like allowing typographers to control the content, style, and editing of prose. — Edward R. Tufte, *The Visual Display of Quantitative Information*

Google and the London City Intelligence have already built this key information into the style guide of their design system, in order to industrialise their processes and guarantee the quality of their products — so why not you?
