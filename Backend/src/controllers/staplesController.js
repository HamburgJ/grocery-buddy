const Category = require('../models/categoryModel');
const CanonicalCategory = require('../models/canonicalCategoryModel');
const mongoose = require('mongoose');

exports.getStaples = async (req, res) => {
  try {
    console.log('Getting staple categories');
    const merchantIds = req.query.merchants ? 
      req.query.merchants.split(',').map(id => parseInt(id.trim())) : 
      null;

    const COMMON_GROCERY_ITEMS = [
      "eggs", "milk", "bread", "cheese", "chicken breast",
      "bananas", "apples", "carrots", "broccoli", "potatoes",
      "rice", "pasta", "cereal", "yogurt", "butter",
      "onions", "tomatoes", "ground beef", "lettuce", "orange juice"
    ];

    // Search for canonical categories matching these items
    const categoryMatches = await CanonicalCategory.aggregate([
      {
        $facet: {
          ...Object.fromEntries(COMMON_GROCERY_ITEMS.map(item => [
            item.replace(/\s+/g, '_'), [
              {
                $match: {
                  $or: [
                    { name: { $regex: item, $options: 'i' } },
                    { base_name: { $regex: item, $options: 'i' } }
                  ]
                }
              },
              {
                $addFields: {
                  matchScore: {
                    $add: [
                      { $cond: [{ $regexMatch: { input: "$name", regex: item, options: "i" } }, 2, 0] },
                      { $cond: [{ $regexMatch: { input: "$base_name", regex: item, options: "i" } }, 1, 0] }
                    ]
                  }
                }
              },
              {
                $match: {
                  matchScore: { $gt: 0 }
                }
              },
              {
                $project: {
                  name: 1,
                  matchScore: 1,
                  cat: 1,
                  base_name: 1
                }
              },
              { $sort: { matchScore: -1 } },
              { $limit: 1 }
            ]
          ]))
        }
      },
      {
        $project: {
          allMatches: {
            $filter: {
              input: {
                $concatArrays: Object.values(
                  Object.fromEntries(
                    COMMON_GROCERY_ITEMS.map(item => [
                      item.replace(/\s+/g, '_'),
                      `$${item.replace(/\s+/g, '_')}`
                    ])
                  )
                )
              },
              as: "match",
              cond: { $ne: ["$$match", null] }
            }
          }
        }
      }
    ]);

    const matchedCategoryIds = categoryMatches[0].allMatches
      .filter(cat => cat && cat._id)
      .map(cat => cat._id);

    // Base pipeline for both data and metadata
    const basePipeline = [
      {
        $match: {
          _id: { $in: matchedCategoryIds }
        }
      },
      {
        $project: {
          name: 1,
          cat: 1,
          base_name: 1,
          icon_url: 1,
          is_clean: 1,
          items: 1,
          interest: 1,
          value: 1,
          categories: 1
        }
      },
      {
        $lookup: {
          from: 'CanonicalItem',
          let: { categoryName: '$name' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$canonical_category', '$$categoryName'] }
              }
            },
            {
              $project: {
                item_id: 1,
                flyer_id: 1,
                canonical_category: 1,
                name: 1,
                price: 1,
                value: 1,
                size: 1,
                unit: 1
              }
            },
            {
              $lookup: {
                from: 'Items',
                let: { itemId: '$item_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ['$item_id', '$$itemId'] },
                      ...(merchantIds ? { merchant_id: { $in: merchantIds } } : {})
                    }
                  },
                  {
                    $project: {
                      item_id: 1,
                      merchant_id: 1,
                      name: 1,
                      description: 1,
                      price: 1,
                      current_price: 1,
                      category: 1,
                      sale_story: 1,
                      brand: 1,
                      cutout_image_url: 1,
                      discount: 1,
                      valid_from: 1,
                      valid_to: 1,
                      pre_price_text: 1,
                      price_text: 1,
                      unit_pricing: 1,
                      unit_size: 1,
                      unit: 1,
                      image_url: 1,
                      flyer_id: 1,
                      flyer_item_id: 1,
                      flyer_page_number: 1
                    }
                  },
                  {
                    $lookup: {
                      from: 'Merchants',
                      let: { merchantId: '$merchant_id' },
                      pipeline: [
                        {
                          $match: {
                            $expr: { $eq: ['$merchant_id', '$$merchantId'] }
                          }
                        },
                        {
                          $project: {
                            name: 1,
                            name_identifier: 1,
                            logo_url: 1,
                            flyer_url: 1,
                            is_active: 1
                          }
                        }
                      ],
                      as: 'merchant'
                    }
                  },
                  {
                    $unwind: {
                      path: '$merchant',
                      preserveNullAndEmptyArrays: true
                    }
                  }
                ],
                as: 'originalItem'
              }
            },
            {
              $unwind: {
                path: '$originalItem',
                preserveNullAndEmptyArrays: true
              }
            }
          ],
          as: 'canonicalItems'
        }
      },
      {
        $match: {
          'canonicalItems.0': { $exists: true }
        }
      }
    ];

    const result = await CanonicalCategory.aggregate([
      {
        $facet: {
          metadata: [
            ...basePipeline,
            {
              $group: {
                _id: null,
                totalCount: { $sum: 1 },
                totalItems: { $sum: { $size: '$canonicalItems' } },
                avgItemsPerCategory: { $avg: { $size: '$canonicalItems' } }
              }
            }
          ],
          data: basePipeline
        }
      }
    ]);

    const response = {
      metadata: {
        ...(result[0].metadata[0] || {
          totalCount: 0,
          totalItems: 0,
          avgItemsPerCategory: 0
        }),
        query: {
          searchTerms: COMMON_GROCERY_ITEMS,
          merchantIds: merchantIds || null
        }
      },
      data: result[0].data
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching staple categories:', error);
    res.status(500).json({ error: error.message });
  }
};