---
layout: gallery
title: Projects
permalink: /projects/

images:
  - image_path: /assets/sports/PJ_graphic.jpg
    title: PJ
  - image_path: /assets/sports/so_composition.png
    title: Ks
---

<ul class="photo-gallery">
  {% for image in page.images %}
    <li><img src="{{ image.image_path }}" alt="{{ image.title}}"/></li>
  {% endfor %}
</ul>