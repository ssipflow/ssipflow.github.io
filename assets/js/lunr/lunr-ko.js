---
layout: null
---

var idx = lunr(function () {
  this.field('title')
  this.field('excerpt')
  this.field('categories')
  this.field('tags')
  this.ref('id')

  this.pipeline.remove(lunr.trimmer)

  for (var item in store) {
    this.add({
      title: store[item].title,
      excerpt: store[item].excerpt,
      categories: store[item].categories,
      tags: store[item].tags,
      id: item
    })
  }
});

console.log( jQuery.type(idx) );

$(document).ready(function() {
  $('input#search').on('keyup', function () {
    var resultdiv = $('#results');
    var query = $(this).val().toLowerCase();
    var result =
      idx.query(function (q) {
        query.split(lunr.tokenizer.separator).forEach(function (term) {
          q.term(term, { boost: 100 })
          if(query.lastIndexOf(" ") != query.length-1){
            q.term(term, {  usePipeline: false, wildcard: lunr.Query.wildcard.TRAILING, boost: 10 })
          }
          if (term != ""){
            q.term(term, {  usePipeline: false, editDistance: 1, boost: 1 })
          }
        })
      });
    resultdiv.empty();
    if (query.length && result.length > 0) {
      resultdiv.prepend('<p class="results__found">'+result.length+' {{ site.data.ui-text[site.locale].results_found | default: "개의 결과를 찾았습니다" }}</p>');
      for (var item in result) {
        var ref = result[item].ref;
        var searchitem = '';
        
        if(store[ref].teaser){
          searchitem = '<div class="list__item">' +
            '<article class="archive__item" itemscope itemtype="http://schema.org/CreativeWork">' +
              '<h2 class="archive__item-title" itemprop="headline">' +
                '<a href="'+store[ref].url+'" rel="permalink">'+store[ref].title+'</a>' +
              '</h2>' +
              '<div class="archive__item-teaser">' +
                '<img src="'+store[ref].teaser+'" alt="">' +
              '</div>' +
              '<p class="archive__item-excerpt" itemprop="description">'+store[ref].excerpt.substring(0,160)+'...</p>';
        } else {
          searchitem = '<div class="list__item">' +
            '<article class="archive__item" itemscope itemtype="http://schema.org/CreativeWork">' +
              '<h2 class="archive__item-title" itemprop="headline">' +
                '<a href="'+store[ref].url+'" rel="permalink">'+store[ref].title+'</a>' +
              '</h2>' +
              '<p class="archive__item-excerpt" itemprop="description">'+store[ref].excerpt.substring(0,160)+'...</p>';
        }
        
        // 카테고리와 태그 표시
        if (store[ref].categories && store[ref].categories.length > 0) {
          searchitem += '<p class="archive__item-meta">';
          searchitem += '<i class="fas fa-folder-open" aria-hidden="true"></i> ';
          for (var i = 0; i < store[ref].categories.length; i++) {
            searchitem += '<span class="archive__item-category">' + store[ref].categories[i] + '</span>';
            if (i < store[ref].categories.length - 1) searchitem += ', ';
          }
          searchitem += '</p>';
        }
        
        if (store[ref].tags && store[ref].tags.length > 0) {
          searchitem += '<p class="archive__item-meta">';
          searchitem += '<i class="fas fa-tags" aria-hidden="true"></i> ';
          for (var i = 0; i < store[ref].tags.length; i++) {
            searchitem += '<span class="archive__item-tag">#' + store[ref].tags[i] + '</span> ';
          }
          searchitem += '</p>';
        }
        
        searchitem += '</article></div>';
        resultdiv.append(searchitem);
      }
    } else if (query.length) {
      resultdiv.prepend('<p class="results__found">검색 결과가 없습니다</p>');
    }
  });
});