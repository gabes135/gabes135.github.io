---
layout: gallery
title: Projects
permalink: /projects/

images:
  - path: /assets/sports/PJ_graphic.jpg
    url: /page1.html
    alt: Image 1
  - path: /assets/sports/so_composition.png
    url: /page2.html
    alt: Image 2

---

<div class="gallery">
  {% for img in page.images %}
    <div class="gallery-item">
      <a href="{{ img.url }}">
        <img src="{{ img.path | relative_url }}" alt="{{ img.alt }}">
      </a>
    </div>
  {% endfor %}
</div>