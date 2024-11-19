const Category = require('../models/categoryModel');
const ItemCategorization = require('../models/itemCategorizationModel');
const CanonicalItem = require('../models/canonicalItemModel');
const CanonicalCategory = require('../models/canonicalCategoryModel');
const mongoose = require('mongoose');
const VALID_CATEGORIES = ['Pantry', 'Deli', 'Meat & Seafood', 'Dairy & Eggs', 'Produce', 'Frozen'];

// Add this lookup stage to both controller methods where we lookup Items
const getItemsLookupPipeline = (merchantIds) => [
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
        // Add merchant lookup
        {
          $lookup: {
            from: 'Merchants',
            let: { merchantId: '$merchant_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$merchant_id', '$$merchantId'] }
                }
              }
            ],
            as: 'merchant'
          }
        },
        // Unwind merchant array to single object
        {
          $unwind: {
            path: '$merchant',
            preserveNullAndEmptyArrays: true
          }
        },
        // Add flyer lookup
        {
          $lookup: {
            from: 'Flyers',
            let: { flyerId: '$flyer_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$flyer_id', '$$flyerId'] },
                      { $lte: [{ $dateFromString: { dateString: '$valid_from' } }, new Date()] },
                      { $gte: [{ $dateFromString: { dateString: '$valid_to' } }, new Date()] }
                    ]
                  }
                }
              }
            ],
            as: 'currentFlyer'
          }
        },
        // Only keep items with valid flyers
        {
          $match: {
            'currentFlyer.0': { $exists: true }
          }
        },
        // Rest of your existing item fields projection
      ],
      as: 'originalItem'
    }
  },
  // Unwind originalItem array to single object
  {
    $unwind: {
      path: '$originalItem',
      preserveNullAndEmptyArrays: true
    }
  },
  // Filter out canonical items with no valid original items
  {
    $match: {
      originalItem: { $exists: true }
    }
  },
  {
    $sort: {
      'price': 1  // Sort by price ascending
    }
  }
];

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
            interest: 1,
            value: 1,
            categories: 1
          }
        },
        
        // Join with canonical items using the new relationship
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
              ...getItemsLookupPipeline(merchantIds),
              {
                $sort: {
                  price: 1  // Sort canonical items by price
                }
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
                    interest: 1,
                    value: 1,
                    categories: 1
                }
            },
            
            // Join with canonical items using the new relationship
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
                        ...getItemsLookupPipeline(merchantIds),
                        {
                            $sort: {
                                price: 1  // Sort canonical items by price
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