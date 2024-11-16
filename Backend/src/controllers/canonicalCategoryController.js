const Category = require('../models/categoryModel');
const ItemCategorization = require('../models/itemCategorizationModel');
const CanonicalItem = require('../models/canonicalItemModel');
const CanonicalCategory = require('../models/canonicalCategoryModel');
const mongoose = require('mongoose');
const VALID_CATEGORIES = ['Pantry', 'Deli', 'Meat & Seafood', 'Dairy & Eggs', 'Produce', 'Frozen'];

exports.getCanonicalCategories = async (req, res) => {
    try {
      console.log('Getting canonical categories');
      
      const DEFAULT_LIMIT = 15;
      const MAX_LIMIT = 100;
      
      const searchQuery = req.query.q;
      const skip = parseInt(req.query.skip) || 0;
      const requestedLimit = parseInt(req.query.limit) || DEFAULT_LIMIT;
      const limit = Math.min(requestedLimit, MAX_LIMIT);
      const sortBy = req.query.sortBy || 'interest';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      
      let categories = req.query.categories ? 
        req.query.categories.split(',').map(c => c.trim()) : 
        VALID_CATEGORIES;
      
      categories = categories.filter(cat => VALID_CATEGORIES.includes(cat));
      
      // Handle merchantIds parameter
      let merchantIds = req.query.merchantIds ? 
        req.query.merchantIds.split(',').map(id => parseInt(id.trim())) : 
        null;

      // Base pipeline for both data and metadata
      const basePipeline = [
        // Initial category filter
        {
          $match: {
            cat: { $in: categories }
          }
        },
        
        // Project necessary fields
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
        
        // Join with canonical items and filter by merchant
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
                              _id: 0,
                              name: 1,
                              logo_url: 1,
                              merchant_id: 1
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
                $match: {
                  'originalItem.0': { $exists: true }
                }
              },
              {
                $unwind: '$originalItem'
              }
            ],
            as: 'canonicalItems'
          }
        },

        // Apply search filter if query exists
        ...(searchQuery ? [{
          $match: {
            $or: [
              { name: { $regex: searchQuery, $options: 'i' } },
              { 'canonicalItems.name': { $regex: searchQuery, $options: 'i' } }
            ]
          }
        }] : []),

        // Filter out categories with no items after merchant filtering
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
                  categoryCounts: { 
                    $push: {
                      category: '$cat',
                      count: 1
                    }
                  },
                  totalItems: { $sum: { $size: '$canonicalItems' } },
                  avgItemsPerCategory: { $avg: { $size: '$canonicalItems' } }
                }
              },
              // Aggregate category counts
              {
                $project: {
                  totalCount: 1,
                  totalItems: 1,
                  avgItemsPerCategory: 1,
                  categoryCounts: {
                    $reduce: {
                      input: '$categoryCounts',
                      initialValue: {},
                      in: {
                        $mergeObjects: [
                          '$$value',
                          {
                            $arrayToObject: [[{
                              k: '$$this.category',
                              v: { 
                                $add: [{ $ifNull: [{ $getField: { field: { $concat: ['$$this.category'] }, input: '$$value' } }, 0] }, 1]
                              }
                            }]]
                          }
                        ]
                      }
                    }
                  }
                }
              }
            ],
            data: [
              ...basePipeline,
              // Sort
              { $sort: { [sortBy]: sortOrder } },
              // Pagination
              { $skip: skip },
              { $limit: limit }
            ]
          }
        }
      ]);
  
      // Format the response
      const response = {
        metadata: {
          ...(result[0].metadata[0] || {
            totalCount: 0,
            totalItems: 0,
            avgItemsPerCategory: 0,
            categoryCounts: {}
          }),
          query: {
            searchTerm: searchQuery || null,
            categories,
            merchantIds: merchantIds || null,
            skip,
            limit,
            sortBy,
            sortOrder: sortOrder === 1 ? 'asc' : 'desc'
          },
          pagination: {
            currentPage: Math.floor(skip / limit) + 1,
            itemsPerPage: limit,
            totalPages: Math.ceil((result[0].metadata[0]?.totalCount || 0) / limit),
            hasMore: (result[0].metadata[0]?.totalCount || 0) > (skip + limit)
          },
          validCategories: VALID_CATEGORIES
        },
        data: result[0].data
      };
  
      res.status(200).json(response);
    } catch (error) {
      console.error('Error fetching canonical categories:', error);
      res.status(500).json({ error: error.message });
    }
  };

exports.getCanonicalCategoriesByIds = async (req, res) => {
    try {
        console.log('Getting canonical categories by IDs');
        
        const ids = req.query.ids ? 
            req.query.ids.split(',').map(id => id.trim()) : 
            [];
            
        if (ids.length === 0) {
            return res.status(400).json({ error: 'No IDs provided' });
        }

        // Validate ObjectId format
        const validObjectIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id))
                                .map(id => new mongoose.Types.ObjectId(id));

        if (validObjectIds.length === 0) {
            return res.status(400).json({ error: 'No valid ObjectIds provided' });
        }

        // Get category filters
        const categories = req.query.categories ? 
            req.query.categories.split(',').map(c => c.trim()) : 
            VALID_CATEGORIES;
      
        const filteredCategories = categories.filter(cat => VALID_CATEGORIES.includes(cat));

        // Get merchant filters
        let merchantIds = req.query.merchantIds ? 
            req.query.merchantIds.split(',').map(id => parseInt(id.trim())) : 
            null;

        // Base pipeline for both data and metadata
        const basePipeline = [
            {
                $match: {
                    _id: { $in: validObjectIds },
                    cat: { $in: filteredCategories }
                }
            },
            
            // Get necessary fields from CanonicalCategory
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
            
            // Join with canonical items
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
            
            // Always filter out categories with no items
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
                    ids,
                    categories: filteredCategories,
                    merchantIds: merchantIds || null
                }
            },
            data: result[0].data
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error fetching canonical categories by IDs:', error);
        res.status(500).json({ error: error.message });
    }
};

exports.getCanonicalCategoryFeatured = async (req, res) => {
    // we just call getCanonicalCategories for now as a placeholder
    this.getCanonicalCategories(req, res);
}