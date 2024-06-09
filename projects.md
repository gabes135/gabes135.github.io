---
layout: gallery
title: Projects
permalink: /projects/
---

<div class="gallery">
  {% for image in site.static_files %}
    {% if image.path contains '/assets/sports/' %}
      <div class="gallery-item">
        <img src="{{ image.path | relative_url }}" alt="{{ image.name }}">
      </div>
    {% endif %}
  {% endfor %}
</div>