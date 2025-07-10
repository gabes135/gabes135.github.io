---
layout: projects
title: Projects
permalink: /projects/

images:
  - path: /assets/sports/PJ_graphic.jpg
    url: /pj/
    alt: Image 1
    gallery: 1

  - path: /assets/sports/salaries.png
    url: /contracts/
    alt: Image 2
    gallery: 2
   
  - path: /assets/sports/contract_values.png
    url: /contracts/
    alt: Image 3
    gallery: 2

  - path: /assets/sports/jump_shot_zone.png
    url: /shot_chart/
    alt: Image 4
    gallery: 3

  - path: /assets/sports/w_100m_fr.png
    url: /swimming/
    alt: Image 4
    gallery: 4

  - path: /assets/sports/m_100m_fr.png
    url: /swimming/
    alt: Image 5
    gallery: 4

  - path: /assets/sports/top3_k_bb.png
    url: /k_bb_9/
    alt: Image 6
    gallery: 5

---


Click on images for more info.

# Tarik Skubal is on a Historic Pace
{% include gallery.html filter=5 %}

<br>

# Evolution of Olympic Swimming Gold Medal Times
{% include gallery.html filter=4 %}

<br>

# Jump Shot Zone Breakdown by Year
{% include gallery.html filter=3 %}

<br>

# Distributions of Salaries Within Each Sports League
{% include gallery.html filter=2 %}

<br>

# Phil Jackson's "40 Wns Before 20 Loses" Rule

{% include gallery.html filter=1 %}




<!-- <div class="gallery">
  {% for img in page.images %}
    <div class="gallery-item">
      <a href="{{ img.url }}">
        <img src="{{ img.path | relative_url }}" alt="{{ img.alt }}">
      </a>
    </div>
  {% endfor %}
</div> -->

